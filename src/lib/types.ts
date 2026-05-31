import type { CATEGORY_OPTIONS, FLAG_META } from "@/lib/constants";

export type CategoryName = (typeof CATEGORY_OPTIONS)[number];
export type ReceiptFlag = keyof typeof FLAG_META;

export type LineItem = {
  id: string;
  receipt_id: string;
  name: string;
  qty: number | null;
  price: number | null;
};

export type Tag = {
  id: string;
  receipt_id: string;
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
  currency: string | null;
  payment_method: string | null;
  category: string | null;
  summary: string | null;
  flags: ReceiptFlag[];
  confidence: number | null;
  created_at: string;
  line_items?: LineItem[];
  tags?: Tag[];
};

export type CategoryRecord = {
  id: string;
  user_id: string;
  name: string;
  is_custom: boolean;
};

export type ReceiptFilters = {
  query?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  flag?: string;
  sort?: "date" | "total" | "merchant" | "category";
  order?: "asc" | "desc";
};

export type UploadQueueStatus = "uploading" | "processing" | "done" | "failed";
