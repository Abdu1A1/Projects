import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function createMonthlySummary(input: {
  totalSpent: number;
  receiptCount: number;
  topCategory: string;
  topMerchant: string;
  categoryBreakdown: Array<{ category: string; total: number }>;
}) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 180,
    system: "You are a finance assistant. Return 2-3 plain English sentences. No markdown.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: JSON.stringify(input),
          },
        ],
      },
    ],
  });

  return response.content.filter((item) => item.type === "text").map((item) => item.text).join("\n").trim();
}
