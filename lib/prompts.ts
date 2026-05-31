import type { MonthlySummary, ReceiptExtraction } from "@/lib/types";

export const RECEIPT_SYSTEM_PROMPT = `You are a receipt parser. Extract all data from the receipt image and return ONLY valid JSON with this exact structure. Never add explanation. If a field is unreadable return null. Never guess totals.

{
  "merchant": string | null,
  "date": "YYYY-MM-DD" | null,
  "time": "HH:MM" | null,
  "total": number | null,
  "tax": number | null,
  "currency": string | null,
  "payment_method": string | null,
  "category": string | null,
  "line_items": [{ "name": string, "qty": number, "price": number }],
  "summary": string,
  "flags": string[],
  "confidence": number between 0 and 1
}

Category must be one of: Grocery, Restaurant, Gas, Shopping, Bills, Subscriptions, Electronics, Home, Pets, Medical, Travel, Business, School, Other

Flag rules — include the flag string if the condition is true:
- "high_tax" → tax is more than 20% of subtotal
- "possible_duplicate" → note if merchant + total seems repeated
- "refund_detected" → total is negative or receipt contains the word REFUND
- "missing_total" → total could not be found
- "suspicious_charge" → a single line item is more than 80% of the total
- "low_confidence" → you are not confident in the extraction

Category rules:
- Costco → Grocery
- Shell, Esso, Petro-Canada, BP → Gas
- Amazon, eBay → Shopping
- Uber, Lyft, Airbnb → Travel
- Tim Hortons, McDonald's, Subway → Restaurant`;

export function buildFewShotExamples(
  corrections: Array<{ merchant: string | null; corrected_category: string; original_category: string | null }>,
) {
  if (!corrections.length) return "";

  const lines = corrections
    .filter((correction) => correction.merchant)
    .slice(0, 5)
    .map(
      (correction) =>
        `Merchant: ${correction.merchant} | previous category: ${correction.original_category ?? "unknown"} | corrected category: ${correction.corrected_category}`,
    );

  if (!lines.length) return "";

  return `Use these user-specific category corrections as guidance for this account:\n${lines.join("\n")}`;
}

export function buildMonthlySummaryPrompt(payload: {
  monthLabel: string;
  totalSpent: number;
  receiptCount: number;
  topCategory: string;
  topMerchant: string;
  categoryBreakdown: Array<{ category: string; total: number }>;
}) {
  return `You are helping summarize a month of spending data. Reply with 2-3 plain English sentences and no bullets.

Month: ${payload.monthLabel}
Total spent: ${payload.totalSpent}
Receipt count: ${payload.receiptCount}
Top category: ${payload.topCategory}
Top merchant: ${payload.topMerchant}
Category breakdown: ${JSON.stringify(payload.categoryBreakdown)}`;
}

export function fallbackMonthlySummary(summary: MonthlySummary, stats: {
  totalSpent: number;
  receiptCount: number;
  topCategory: string;
  topMerchant: string;
}) {
  return `${summary.monthLabel}: you spent ${stats.totalSpent.toFixed(2)} across ${stats.receiptCount} receipts. ${stats.topCategory} was the largest category, and ${stats.topMerchant} appeared most often.`;
}

export function stripJsonFence(raw: string) {
  return raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
}

export function fallbackExtraction(fileName: string): ReceiptExtraction {
  const baseMerchant = fileName.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ").trim() || "Manual review";
  return {
    merchant: baseMerchant,
    date: new Date().toISOString().slice(0, 10),
    time: null,
    total: null,
    tax: null,
    currency: "CAD",
    payment_method: null,
    category: "Other",
    line_items: [],
    summary: "Receipt uploaded without AI extraction because an Anthropic API key is not configured.",
    flags: ["missing_total", "low_confidence"],
    confidence: 0,
  };
}
