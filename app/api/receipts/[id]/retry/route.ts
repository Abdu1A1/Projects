import { NextResponse } from "next/server";
import { extractReceiptFromImage } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  context: { params: { id: string } },
) {
  const receiptId = context.params.id;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: receipt, error: receiptError } = await supabase
    .from("receipts")
    .select("id, image_url")
    .eq("id", receiptId)
    .eq("user_id", user.id)
    .single();

  if (receiptError || !receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  try {
    const extraction = await extractReceiptFromImage({ imageUrl: receipt.image_url });

    await supabase
      .from("line_items")
      .delete()
      .eq("receipt_id", receipt.id);

    await supabase
      .from("receipts")
      .update({
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
        flags: extraction.parsed.flags,
        confidence: extraction.parsed.confidence,
      })
      .eq("id", receipt.id)
      .eq("user_id", user.id);

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

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Retry failed" },
      { status: 500 },
    );
  }
}
