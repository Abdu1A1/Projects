import Anthropic from "@anthropic-ai/sdk";
import { extractionSchema, type ReceiptExtraction } from "@/lib/types";

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

type CorrectionExample = {
  merchant: string | null;
  previous_category: string | null;
  corrected_category: string;
};

function extractJsonObject(content: string) {
  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
    throw new Error("AI response did not contain JSON object");
  }

  return content.slice(firstBrace, lastBrace + 1);
}

export async function extractReceiptFromImage(params: {
  imageUrl: string;
  corrections?: CorrectionExample[];
}): Promise<{ parsed: ReceiptExtraction; raw: string }> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  const correctionPrompt =
    params.corrections && params.corrections.length > 0
      ? `\n\nUser-specific category correction examples:\n${params.corrections
          .map(
            (example, index) =>
              `${index + 1}. Merchant: ${example.merchant ?? "unknown"}, previous category: ${example.previous_category ?? "unknown"}, corrected category: ${example.corrected_category}`,
          )
          .join("\n")}\nUse these examples when assigning category.`
      : "";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1200,
    system: RECEIPT_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Parse this receipt.${correctionPrompt}`,
          },
          {
            type: "image",
            source: {
              type: "url",
              url: params.imageUrl,
            },
          },
        ],
      },
    ],
  });

  const text = response.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n")
    .trim();

  const jsonPayload = extractJsonObject(text);
  const parsed = extractionSchema.parse(JSON.parse(jsonPayload));

  return { parsed, raw: text };
}

export async function generateMonthlySummary(input: {
  month: string;
  total: number;
  receiptCount: number;
  topCategory: string;
  topMerchant: string;
}) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicKey) {
    return `This month you spent ${input.total.toFixed(2)} across ${input.receiptCount} receipts. ${input.topCategory} was your biggest category and ${input.topMerchant} was your most frequent merchant.`;
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 220,
    system:
      "You are a financial assistant. Return a concise 2-3 sentence summary in plain English.",
    messages: [
      {
        role: "user",
        content: `Summarize this user's month:\nMonth: ${input.month}\nTotal spent: ${input.total}\nReceipt count: ${input.receiptCount}\nTop category: ${input.topCategory}\nTop merchant: ${input.topMerchant}`,
      },
    ],
  });

  return message.content
    .filter((entry) => entry.type === "text")
    .map((entry) => entry.text)
    .join(" ")
    .trim();
}
