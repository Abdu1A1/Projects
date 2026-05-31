import { NextResponse } from "next/server";
import { addDays, subDays } from "date-fns";
import { extractReceiptFromImage } from "@/lib/ai";
import { uploadReceiptToCloudinary } from "@/lib/cloudinary";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    await supabase.from("users").upsert(
      {
        id: user.id,
        email: user.email,
      },
      { onConflict: "id" },
    );

    const uploaded = await uploadReceiptToCloudinary(file);

    const { data: corrections } = await supabase
      .from("category_corrections")
      .select("merchant, previous_category, corrected_category")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    try {
      const extraction = await extractReceiptFromImage({
        imageUrl: uploaded.secure_url,
        corrections: corrections ?? [],
      });

      const flags = new Set(extraction.parsed.flags ?? []);

      if ((extraction.parsed.confidence ?? 0) < 0.7) {
        flags.add("low_confidence");
      }

      if (extraction.parsed.total === null) {
        flags.add("missing_total");
      }

      if (
        extraction.parsed.merchant &&
        extraction.parsed.total !== null &&
        extraction.parsed.date
      ) {
        const targetDate = new Date(`${extraction.parsed.date}T00:00:00.000Z`);
        const { data: duplicate } = await supabase
          .from("receipts")
          .select("id")
          .eq("user_id", user.id)
          .eq("merchant", extraction.parsed.merchant)
          .eq("total", extraction.parsed.total)
          .gte("date", subDays(targetDate, 1).toISOString().slice(0, 10))
          .lte("date", addDays(targetDate, 1).toISOString().slice(0, 10))
          .limit(1)
          .maybeSingle();

        if (duplicate) {
          flags.add("possible_duplicate");
        }
      }

      const { data: receipt, error: receiptError } = await supabase
        .from("receipts")
        .insert({
          user_id: user.id,
          image_url: uploaded.secure_url,
          raw_text: extraction.raw,
          merchant: extraction.parsed.merchant,
          date: extraction.parsed.date,
          time: extraction.parsed.time,
          total: extraction.parsed.total,
          tax: extraction.parsed.tax,
          currency: extraction.parsed.currency ?? "CAD",
          payment_method: extraction.parsed.payment_method,
          category: extraction.parsed.category,
          summary: extraction.parsed.summary,
          flags: Array.from(flags),
          confidence: extraction.parsed.confidence,
        })
        .select("id")
        .single();

      if (receiptError || !receipt) {
        return NextResponse.json(
          { error: receiptError?.message || "Failed to insert receipt" },
          { status: 500 },
        );
      }

      if (extraction.parsed.line_items.length > 0) {
        await supabase.from("line_items").insert(
          extraction.parsed.line_items.map((lineItem) => ({
            receipt_id: receipt.id,
            name: lineItem.name,
            qty: lineItem.qty,
            price: lineItem.price,
          })),
        );
      }

      return NextResponse.json({ receiptId: receipt.id, confidence: extraction.parsed.confidence });
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Unknown parse error";

      const { data: fallbackReceipt, error: fallbackError } = await supabase
        .from("receipts")
        .insert({
          user_id: user.id,
          image_url: uploaded.secure_url,
          raw_text: errorText,
          confidence: 0,
          flags: ["low_confidence", "missing_total"],
          currency: "CAD",
          summary: "Unable to parse this receipt. Please review manually.",
        })
        .select("id")
        .single();

      if (fallbackError || !fallbackReceipt) {
        return NextResponse.json(
          { error: fallbackError?.message || "Processing failed" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        receiptId: fallbackReceipt.id,
        confidence: 0,
        warning: "Receipt saved for manual review",
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
