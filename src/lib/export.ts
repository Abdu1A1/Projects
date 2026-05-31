import Papa from "papaparse";

import type { Receipt } from "@/lib/types";

export function flattenReceiptsForExport(receipts: Receipt[]) {
  return receipts.map((receipt) => ({
    id: receipt.id,
    merchant: receipt.merchant,
    date: receipt.date,
    time: receipt.time,
    total: receipt.total,
    tax: receipt.tax,
    currency: receipt.currency,
    payment_method: receipt.payment_method,
    category: receipt.category,
    summary: receipt.summary,
    confidence: receipt.confidence,
    flags: receipt.flags?.join(", ") ?? "",
    tags: receipt.tags?.map((tag) => tag.label).join(", ") ?? "",
    line_items: receipt.line_items
      ?.map((item) => `${item.name} x${item.qty ?? 1} @ ${item.price ?? 0}`)
      .join(" | ") ?? "",
    image_url: receipt.image_url,
    raw_text: receipt.raw_text,
    created_at: receipt.created_at,
  }));
}

export function generateReceiptCsv(receipts: Receipt[]) {
  return Papa.unparse(flattenReceiptsForExport(receipts));
}
