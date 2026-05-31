import type { ReceiptFlag } from "@/types/receipt";

export const APP_NAME = "ReceiptAI";

export const FLAG_STYLES: Record<ReceiptFlag, { label: string; className: string }> = {
  high_tax: { label: "High tax", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200" },
  possible_duplicate: { label: "Possible duplicate", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200" },
  refund_detected: { label: "Refund", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200" },
  missing_total: { label: "Missing total", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200" },
  suspicious_charge: { label: "Suspicious charge", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200" },
  low_confidence: { label: "Low confidence", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200" },
};

export const EXTRACT_RECEIPT_SYSTEM_PROMPT = `You are a receipt parser. Extract all data from the receipt image and return ONLY valid JSON with this exact structure. Never add explanation. If a field is unreadable return null. Never guess totals.

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

export const MAX_BATCH_UPLOAD = 10;
export const BATCH_CONCURRENCY = 5;
