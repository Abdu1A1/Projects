import type { SupabaseClient } from "@supabase/supabase-js";

import type { ExtractionResult } from "@/lib/ai/schemas";

export async function insertReceiptWithRelations(
  supabase: SupabaseClient,
  params: {
    userId: string;
    imageUrl: string;
    rawText: string;
    extraction: ExtractionResult;
  },
) {
  const { userId, imageUrl, rawText, extraction } = params;

  const receiptInsert = {
    user_id: userId,
    image_url: imageUrl,
    raw_text: rawText,
    merchant: extraction.merchant,
    date: extraction.date,
    time: extraction.time,
    total: extraction.total,
    tax: extraction.tax,
    currency: extraction.currency ?? "CAD",
    payment_method: extraction.payment_method,
    category: extraction.category,
    summary: extraction.summary,
    flags: extraction.flags,
    confidence: extraction.confidence,
  };

  const { data: receipt, error: receiptError } = await supabase.from("receipts").insert(receiptInsert).select("id").single();

  if (receiptError || !receipt) {
    throw receiptError ?? new Error("Failed to insert receipt.");
  }

  if (extraction.line_items.length) {
    const { error: lineItemsError } = await supabase.from("line_items").insert(
      extraction.line_items.map((item) => ({
        receipt_id: receipt.id,
        name: item.name,
        qty: item.qty,
        price: item.price,
      })),
    );

    if (lineItemsError) {
      throw lineItemsError;
    }
  }

  const tagSet = new Set<string>();
  if (extraction.category) {
    tagSet.add(extraction.category.toLowerCase());
  }
  extraction.flags.forEach((flag) => tagSet.add(flag));

  if (tagSet.size) {
    const { error: tagsError } = await supabase.from("tags").insert(
      Array.from(tagSet).map((label) => ({
        receipt_id: receipt.id,
        label,
      })),
    );

    if (tagsError) {
      throw tagsError;
    }
  }

  return receipt.id;
}

export async function detectDuplicate(
  supabase: SupabaseClient,
  userId: string,
  merchant: string | null,
  total: number | null,
  date: string | null,
) {
  if (!merchant || total === null || !date) {
    return null;
  }

  const from = new Date(`${date}T00:00:00.000Z`);
  const to = new Date(from);
  from.setHours(from.getHours() - 24);
  to.setHours(to.getHours() + 24);

  const { data } = await supabase
    .from("receipts")
    .select("id, merchant, total, date")
    .eq("user_id", userId)
    .ilike("merchant", merchant)
    .eq("total", total)
    .gte("date", from.toISOString().slice(0, 10))
    .lte("date", to.toISOString().slice(0, 10))
    .limit(1)
    .maybeSingle();

  return data;
}
