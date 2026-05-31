import { z } from "zod";
import { DEFAULT_CATEGORIES } from "@/lib/constants";

export const lineItemSchema = z.object({
  name: z.string().min(1),
  qty: z.number().nullable(),
  price: z.number().nullable(),
});

export const receiptExtractionSchema = z.object({
  merchant: z.string().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  total: z.number().nullable(),
  tax: z.number().nullable(),
  currency: z.string().nullable(),
  payment_method: z.string().nullable(),
  category: z.enum(DEFAULT_CATEGORIES).nullable(),
  line_items: z.array(lineItemSchema),
  summary: z.string(),
  flags: z.array(z.enum(["high_tax", "possible_duplicate", "refund_detected", "missing_total", "suspicious_charge", "low_confidence"])),
  confidence: z.number().min(0).max(1),
});

export const receiptPatchSchema = z.object({
  merchant: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  time: z.string().nullable().optional(),
  total: z.number().nullable().optional(),
  tax: z.number().nullable().optional(),
  currency: z.string().optional(),
  payment_method: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  flags: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  tags: z.array(z.string()).optional(),
  line_items: z.array(lineItemSchema.extend({ id: z.string().optional() })).optional(),
  originalCategory: z.string().nullable().optional(),
});
