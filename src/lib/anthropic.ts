import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { CATEGORY_OPTIONS } from "@/lib/constants";
import { env, hasAnthropicEnv, requireEnv } from "@/lib/env";

const extractionSchema = z.object({
  merchant: z.string().nullable(),
  date: z.string().nullable(),
  time: z.string().nullable(),
  total: z.number().nullable(),
  tax: z.number().nullable(),
  currency: z.string().nullable(),
  payment_method: z.string().nullable(),
  category: z.string().nullable(),
  line_items: z.array(
    z.object({
      name: z.string(),
      qty: z.number(),
      price: z.number(),
    }),
  ),
  summary: z.string(),
  flags: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export type ClaudeExtraction = z.infer<typeof extractionSchema>;

const RECEIPT_SYSTEM_PROMPT = `You are a receipt parser. Extract all data from the receipt image and return ONLY valid JSON with this exact structure. Never add explanation. If a field is unreadable return null. Never guess totals.

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

let anthropicClient: Anthropic | null = null;

function getAnthropicClient() {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: requireEnv("ANTHROPIC_API_KEY"),
    });
  }

  return anthropicClient;
}

function stripJsonFence(rawText: string) {
  return rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

export function normalizeCategory(category: string | null) {
  if (!category) {
    return "Other";
  }

  const match = CATEGORY_OPTIONS.find(
    (option) => option.toLowerCase() === category.toLowerCase(),
  );

  return match ?? "Other";
}

export async function extractReceiptWithClaude(args: {
  base64: string;
  mediaType: string;
  fewShotExamples?: Array<{
    merchant: string | null;
    excerpt: string | null;
    correctedCategory: string;
  }>;
}) {
  if (!hasAnthropicEnv()) {
    throw new Error("Anthropic API key is not configured.");
  }

  const anthropic = getAnthropicClient();
  const examples = args.fewShotExamples?.length
    ? `Use these category correction examples as user preferences:\n${args.fewShotExamples
        .map((example, index) => {
          const merchant = example.merchant ?? "Unknown merchant";
          const excerpt = example.excerpt ? `Excerpt: ${example.excerpt}` : "Excerpt: unavailable";
          return `${index + 1}. Merchant: ${merchant}\n${excerpt}\nCorrect category: ${example.correctedCategory}`;
        })
        .join("\n\n")}`
    : "No prior user correction examples were supplied.";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    temperature: 0,
    system: RECEIPT_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${examples}\n\nParse this receipt and return only the JSON object.`,
          },
          args.mediaType === "application/pdf"
            ? {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: args.base64,
                },
              }
            : {
                type: "image",
                source: {
                  type: "base64",
                  media_type: args.mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                  data: args.base64,
                },
              },
        ],
      },
    ],
  });

  const textContent = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  const parsed = JSON.parse(stripJsonFence(textContent));
  const normalized = extractionSchema.parse(parsed);

  return {
    ...normalized,
    category: normalizeCategory(normalized.category),
  };
}

export function buildFallbackMonthlySummary(args: {
  totalSpent: number;
  receiptCount: number;
  topCategory: string;
  topCategoryTotal: number;
  topMerchant: string;
}) {
  return `This month you spent ${new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(args.totalSpent)} across ${args.receiptCount} receipts. ${args.topCategory} was your biggest category at ${new Intl.NumberFormat(
    "en-CA",
    {
      style: "currency",
      currency: "CAD",
    },
  ).format(args.topCategoryTotal)}. ${args.topMerchant} was your most visited merchant.`;
}

export async function summarizeMonthlySpending(payload: Record<string, unknown>) {
  if (!env.anthropicApiKey) {
    return null;
  }

  const anthropic = getAnthropicClient();
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 180,
    temperature: 0.2,
    system: "You summarize monthly personal finance data. Return 2-3 plain English sentences only.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Summarize this monthly spending data in 2-3 plain English sentences:\n${JSON.stringify(payload)}`,
          },
        ],
      },
    ],
  });

  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text.trim())
    .join(" ")
    .trim();
}
