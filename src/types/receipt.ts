export type ReceiptFlag =
  | "high_tax"
  | "possible_duplicate"
  | "refund_detected"
  | "missing_total"
  | "suspicious_charge"
  | "low_confidence";

export const RECEIPT_CATEGORIES = [
  "Grocery",
  "Restaurant",
  "Gas",
  "Shopping",
  "Bills",
  "Subscriptions",
  "Electronics",
  "Home",
  "Pets",
  "Medical",
  "Travel",
  "Business",
  "School",
  "Other",
] as const;

export type ReceiptCategory = (typeof RECEIPT_CATEGORIES)[number];

export interface LineItem {
  id?: string;
  name: string;
  qty: number;
  price: number;
}

export interface ReceiptRecord {
  id: string;
  user_id: string;
  image_url: string | null;
  raw_text: string | null;
  merchant: string | null;
  date: string | null;
  time: string | null;
  total: number | null;
  tax: number | null;
  currency: string | null;
  payment_method: string | null;
  category: string | null;
  summary: string | null;
  flags: ReceiptFlag[];
  confidence: number;
  created_at: string;
  line_items?: LineItem[];
  tags?: { id: string; label: string }[];
}

export interface ReceiptFilters {
  q?: string;
  category?: string;
  from?: string;
  to?: string;
  min?: string;
  max?: string;
  flags?: string;
  sort?: "date" | "total" | "merchant" | "category";
  order?: "asc" | "desc";
}
