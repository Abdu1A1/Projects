import { z } from "zod";

import { RECEIPT_CATEGORIES } from "@/types/receipt";

export const lineItemSchema = z.object({
  name: z.string().min(1),
  qty: z.number().nullable().transform((value) => value ?? 1),
  price: z.number().nullable().transform((value) => value ?? 0),
});

export const extractionSchema = z.object({
  merchant: z.string().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  time: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  total: z.number().nullable(),
  tax: z.number().nullable(),
  currency: z.string().nullable(),
  payment_method: z.string().nullable(),
  category: z
    .string()
    .nullable()
    .transform((value) => (value && RECEIPT_CATEGORIES.includes(value as (typeof RECEIPT_CATEGORIES)[number]) ? value : "Other")),
  line_items: z.array(lineItemSchema),
  summary: z.string().default("No summary available."),
  flags: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export type ExtractionResult = z.infer<typeof extractionSchema>;
