export type ReceiptFlag =
  | "high_tax"
  | "possible_duplicate"
  | "refund_detected"
  | "missing_total"
  | "suspicious_charge"
  | "low_confidence";

export type QueueStatus = "idle" | "uploading" | "processing" | "done" | "failed";

export type ReceiptLineItem = {
  id: string;
  receipt_id?: string;
  name: string;
  qty: number | null;
  price: number | null;
};

export type ReceiptTag = {
  id: string;
  receipt_id?: string;
  label: string;
};

export type Receipt = {
  id: string;
  user_id: string;
  image_url: string | null;
  raw_text: string | null;
  merchant: string | null;
  date: string | null;
  time: string | null;
  total: number | null;
  tax: number | null;
  currency: string;
  payment_method: string | null;
  category: string | null;
  summary: string | null;
  flags: ReceiptFlag[];
  confidence: number;
  created_at: string;
  line_items: ReceiptLineItem[];
  tags: ReceiptTag[];
};

export type Category = {
  id: string;
  user_id: string | null;
  name: string;
  is_custom: boolean;
};

export type ReceiptFilters = {
  query?: string;
  category?: string;
  flag?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  sort?: "date" | "total" | "merchant" | "category";
  direction?: "asc" | "desc";
  view?: "grid" | "time" | "merchant";
};

export type ReceiptExtraction = {
  merchant: string | null;
  date: string | null;
  time: string | null;
  total: number | null;
  tax: number | null;
  currency: string | null;
  payment_method: string | null;
  category: string | null;
  line_items: Array<{
    name: string;
    qty: number | null;
    price: number | null;
  }>;
  summary: string;
  flags: ReceiptFlag[];
  confidence: number;
};

export type DashboardStats = {
  totalSpentThisMonth: number;
  topCategory: string;
  highestReceipt: number;
  receiptsThisWeek: number;
  donutData: Array<{ name: string; value: number }>;
  lineData: Array<{ date: string; total: number }>;
  merchantData: Array<{ merchant: string; total: number }>;
};

export type FolderGroup = {
  id: string;
  label: string;
  receipts: Receipt[];
  children?: FolderGroup[];
};

export type MonthlySummary = {
  monthLabel: string;
  text: string;
};

export type SessionUser = {
  id: string;
  email: string | null;
  isDemo?: boolean;
};
