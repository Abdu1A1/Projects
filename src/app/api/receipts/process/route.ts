import { NextResponse } from "next/server";

import { extractReceiptWithClaude } from "@/lib/anthropic";
import { fetchUploadedAssetAsBase64, uploadReceiptAsset } from "@/lib/cloudinary";
import { getCategoryCorrections, ensureUserProfile } from "@/lib/receipt-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function buildFlags(args: {
  extractedFlags: string[];
  total: number | null;
  tax: number | null;
  lineItems: Array<{ price: number; qty: number }>;
  confidence: number;
  possibleDuplicate: boolean;
}) {
  const flags = new Set(args.extractedFlags);

  if (args.total === null) {
    flags.add("missing_total");
  }

  if (args.total !== null && args.total < 0) {
    flags.add("refund_detected");
  }

  if (typeof args.tax === "number" && typeof args.total === "number") {
    const subtotal = args.total - args.tax;
    if (subtotal > 0 && args.tax > subtotal * 0.2) {
      flags.add("high_tax");
    }
  }

  if (
    typeof args.total === "number" &&
    args.total !== 0 &&
    args.lineItems.some((item) => (item.price ?? 0) * (item.qty ?? 1) > Math.abs(args.total) * 0.8)
  ) {
    flags.add("suspicious_charge");
  }

  if (args.confidence < 0.7) {
    flags.add("low_confidence");
  }

  if (args.possibleDuplicate) {
    flags.add("possible_duplicate");
  }

  return Array.from(flags);
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUserProfile(user.id, user.email);

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }

    const uploadedAsset = await uploadReceiptAsset(user.id, file);
    const asset = await fetchUploadedAssetAsBase64(uploadedAsset.secureUrl);
    const correctionExamples = await getCategoryCorrections(user.id);

    try {
      const extracted = await extractReceiptWithClaude({
        base64: asset.base64,
        mediaType: asset.mediaType,
        fewShotExamples: correctionExamples,
      });

      let possibleDuplicate = false;
      if (extracted.merchant && extracted.total !== null) {
        const { data: duplicateMatch } = await supabase
          .from("receipts")
          .select("id")
          .eq("user_id", user.id)
          .eq("merchant", extracted.merchant)
          .eq("total", extracted.total)
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1)
          .maybeSingle();

        possibleDuplicate = Boolean(duplicateMatch);
      }

      const flags = buildFlags({
        extractedFlags: extracted.flags,
        total: extracted.total,
        tax: extracted.tax,
        lineItems: extracted.line_items,
        confidence: extracted.confidence,
        possibleDuplicate,
      });

      const { data: insertedReceipt, error: receiptError } = await supabase
        .from("receipts")
        .insert({
          user_id: user.id,
          image_url: uploadedAsset.secureUrl,
          raw_text: JSON.stringify(extracted),
          merchant: extracted.merchant,
          date: extracted.date,
          time: extracted.time,
          total: extracted.total,
          tax: extracted.tax,
          currency: extracted.currency ?? "CAD",
          payment_method: extracted.payment_method,
          category: extracted.category ?? "Other",
          summary: extracted.summary,
          flags,
          confidence: extracted.confidence,
        })
        .select("id")
        .single();

      if (receiptError || !insertedReceipt) {
        throw receiptError ?? new Error("Unable to save receipt.");
      }

      if (extracted.line_items.length) {
        await supabase.from("line_items").insert(
          extracted.line_items.map((item) => ({
            receipt_id: insertedReceipt.id,
            name: item.name,
            qty: item.qty,
            price: item.price,
          })),
        );
      }

      return NextResponse.json({ receiptId: insertedReceipt.id });
    } catch (parsingError) {
      const { data: insertedReceipt, error: fallbackError } = await supabase
        .from("receipts")
        .insert({
          user_id: user.id,
          image_url: uploadedAsset.secureUrl,
          raw_text: parsingError instanceof Error ? parsingError.message : "Parsing failed",
          category: "Other",
          summary: "AI extraction failed. Manual review required.",
          flags: ["missing_total", "low_confidence"],
          confidence: 0,
          currency: "CAD",
        })
        .select("id")
        .single();

      if (fallbackError || !insertedReceipt) {
        throw fallbackError ?? new Error("Unable to save failed receipt.");
      }

      return NextResponse.json({
        receiptId: insertedReceipt.id,
        warning: "Receipt saved for manual review.",
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected receipt processing failure.",
      },
      { status: 500 },
    );
  }
}
