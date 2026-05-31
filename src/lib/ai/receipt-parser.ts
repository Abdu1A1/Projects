import Anthropic from "@anthropic-ai/sdk";

import { EXTRACT_RECEIPT_SYSTEM_PROMPT } from "@/lib/constants";
import { extractionSchema, type ExtractionResult } from "@/lib/ai/schemas";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function getJsonBlock(input: string) {
  const start = input.indexOf("{");
  const end = input.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Claude response did not contain valid JSON.");
  }

  return input.slice(start, end + 1);
}

function renderFewShotExamples(
  corrections: Array<{ merchant: string | null; line_items_text: string | null; corrected_category: string }> = [],
) {
  if (!corrections.length) {
    return "";
  }

  const examples = corrections
    .map((correction, index) => {
      return `Example ${index + 1}\nmerchant: ${correction.merchant ?? "Unknown"}\nline_items: ${
        correction.line_items_text ?? "n/a"
      }\ncategory: ${correction.corrected_category}`;
    })
    .join("\n\n");

  return `\nUser correction examples (prefer these patterns for this user):\n${examples}\n`;
}

export async function parseReceiptWithClaude(params: {
  imageUrl: string;
  corrections?: Array<{ merchant: string | null; line_items_text: string | null; corrected_category: string }>;
}) {
  const { imageUrl, corrections = [] } = params;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1200,
    system: EXTRACT_RECEIPT_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Parse this receipt image and return JSON only.${renderFewShotExamples(corrections)}`,
          },
          {
            type: "image",
            source: {
              type: "url",
              url: imageUrl,
            },
          },
        ],
      },
    ],
  });

  const messageText = response.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");

  const parsedJson = JSON.parse(getJsonBlock(messageText));
  return extractionSchema.parse(parsedJson) as ExtractionResult;
}
