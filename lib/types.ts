import { z } from "zod";
import { RECEIPT_CATEGORIES } from "@/lib/constants";

export type ReceiptCategory = (typeof RECEIPT_CATEGORIES)[number];

export type Receipt = {
  id: string;
  user_id: string;
  image_url: string;
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
  flags: string[] | null;
  confidence: number | null;
  created_at: string;
};

export type LineItem = {
  id: string;
  receipt_id: string;
  name: string;
  qty: number | null;
  price: number | null;
};

export type ReceiptTag = {
  id: string;
  receipt_id: string;
  label: string;
};

export const lineItemSchema = z.object({
  name: z.string().min(1),
  qty: z.number().finite().default(1),
  price: z.number().finite().default(0),
});

export const extractionSchema = z.object({
  merchant: z.string().nullable(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  total: z.number().finite().nullable(),
  tax: z.number().finite().nullable(),
  currency: z.string().nullable(),
  payment_method: z.string().nullable(),
  category: z
    .enum(RECEIPT_CATEGORIES)
    .or(z.string())
    .nullable(),
  line_items: z.array(lineItemSchema),
  summary: z.string().default(""),
  flags: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export type ReceiptExtraction = z.infer<typeof extractionSchema>;

export type DashboardMetrics = {
  totalSpentThisMonth: number;
  topCategory: string;
  highestReceipt: number;
  receiptsThisWeek: number;
  spendByCategory: Array<{ category: string; total: number }>;
  dailySpend: Array<{ date: string; total: number }>;
  topMerchants: Array<{ merchant: string; total: number }>;
};
