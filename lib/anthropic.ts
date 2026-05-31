import Anthropic from "@anthropic-ai/sdk";
import { format } from "date-fns";
import { CLAUDE_MODEL } from "@/lib/constants";
import { hasAnthropicEnv } from "@/lib/env";
import { fallbackExtraction, buildFewShotExamples, buildMonthlySummaryPrompt, fallbackMonthlySummary, RECEIPT_SYSTEM_PROMPT, stripJsonFence } from "@/lib/prompts";
import { buildMonthLabel, normalizeExtraction } from "@/lib/receipt-logic";
import type { MonthlySummary, Receipt } from "@/lib/types";
import { receiptExtractionSchema } from "@/lib/validators";

let anthropicClient: Anthropic | null = null;

function getAnthropic() {
  if (!hasAnthropicEnv()) return null;
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return anthropicClient;
}

export async function extractReceiptFromImage(args: {
  fileName: string;
  imageUrl: string;
  fewShotCorrections: Array<{ merchant: string | null; corrected_category: string; original_category: string | null }>;
}) {
  const anthropic = getAnthropic();
  if (!anthropic) {
    const fallback = fallbackExtraction(args.fileName);
    return { extraction: fallback, rawResponse: JSON.stringify(fallback) };
  }

  const imageResponse = await fetch(args.imageUrl);
  if (!imageResponse.ok) {
    throw new Error("Failed to fetch the uploaded receipt from Cloudinary.");
  }

  const arrayBuffer = await imageResponse.arrayBuffer();
  const contentType = imageResponse.headers.get("content-type") || "image/png";
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const fewShotText = buildFewShotExamples(args.fewShotCorrections);
  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1200,
    system: RECEIPT_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          ...(fewShotText ? [{ type: "text" as const, text: fewShotText }] : []),
          {
            type: "image",
            source: {
              type: "base64",
              media_type: contentType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: base64,
            },
          },
          {
            type: "text",
            text: "Return JSON only.",
          },
        ],
      },
    ],
  });

  const rawResponse = message.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n")
    .trim();

  const parsedJson = JSON.parse(stripJsonFence(rawResponse));
  const extraction = normalizeExtraction(receiptExtractionSchema.parse(parsedJson));

  return { extraction, rawResponse };
}

export async function generateMonthlySummary(receipts: Receipt[]): Promise<MonthlySummary> {
  const monthLabel = buildMonthLabel(receipts);
  const currentMonth = receipts.filter((receipt) => {
    if (!receipt.date) return false;
    return format(new Date(receipt.date), "yyyy-MM") === format(new Date(), "yyyy-MM");
  });

  const totalSpent = currentMonth.reduce((sum, receipt) => sum + (receipt.total || 0), 0);
  const categoryTotals = currentMonth.reduce<Record<string, number>>((acc, receipt) => {
    const key = receipt.category || "Other";
    acc[key] = (acc[key] || 0) + (receipt.total || 0);
    return acc;
  }, {});
  const merchantTotals = currentMonth.reduce<Record<string, number>>((acc, receipt) => {
    const key = receipt.merchant || "Unknown";
    acc[key] = (acc[key] || 0) + (receipt.total || 0);
    return acc;
  }, {});
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "Other";
  const topMerchant = Object.entries(merchantTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";

  const anthropic = getAnthropic();
  const fallbackText = fallbackMonthlySummary(
    { monthLabel, text: "" },
    { totalSpent, receiptCount: currentMonth.length, topCategory, topMerchant },
  );

  if (!anthropic || currentMonth.length === 0) {
    return { monthLabel, text: fallbackText };
  }

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 220,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: buildMonthlySummaryPrompt({
              monthLabel,
              totalSpent,
              receiptCount: currentMonth.length,
              topCategory,
              topMerchant,
              categoryBreakdown: Object.entries(categoryTotals).map(([category, total]) => ({ category, total })),
            }),
          },
        ],
      },
    ],
  });

  const text = response.content.map((block) => (block.type === "text" ? block.text : "")).join(" ").trim() || fallbackText;
  return { monthLabel, text };
}
