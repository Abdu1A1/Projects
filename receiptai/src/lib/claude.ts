import Anthropic from '@anthropic-ai/sdk';
import { ClaudeExtraction, CATEGORIES } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a receipt parser. Extract all data from the receipt image and return ONLY valid JSON with this exact structure. Never add explanation. If a field is unreadable return null. Never guess totals.

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

export async function parseReceiptWithClaude(
  imageUrl: string,
  userCorrections?: Array<{ merchant: string; original_category: string; corrected_category: string }>
): Promise<ClaudeExtraction> {
  let systemPrompt = SYSTEM_PROMPT;

  if (userCorrections && userCorrections.length > 0) {
    const correctionExamples = userCorrections
      .slice(0, 5)
      .map((c) => `- ${c.merchant}: was "${c.original_category}", correct category is "${c.corrected_category}"`)
      .join('\n');
    systemPrompt += `\n\nUser's past corrections (apply these patterns):\n${correctionExamples}`;
  }

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'url',
              url: imageUrl,
            },
          },
          {
            type: 'text',
            text: 'Extract all receipt data and return as JSON only.',
          },
        ],
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Extract JSON from response (handle markdown code blocks)
  let jsonStr = content.text.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr) as ClaudeExtraction;

  // Validate category
  if (parsed.category && !CATEGORIES.includes(parsed.category as typeof CATEGORIES[number])) {
    parsed.category = 'Other';
  }

  // Ensure confidence is between 0 and 1
  if (typeof parsed.confidence !== 'number') {
    parsed.confidence = 0;
  }
  parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));

  // Validate flags
  const validFlags = ['high_tax', 'possible_duplicate', 'refund_detected', 'missing_total', 'suspicious_charge', 'low_confidence'];
  parsed.flags = (parsed.flags || []).filter((f) => validFlags.includes(f));

  // Add low_confidence flag if confidence is below threshold
  if (parsed.confidence < 0.7 && !parsed.flags.includes('low_confidence')) {
    parsed.flags.push('low_confidence');
  }

  return parsed;
}

export async function generateMonthlySummary(data: {
  totalSpent: number;
  receiptCount: number;
  topCategory: string;
  topMerchant: string;
  month: string;
}): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `Generate a 2-3 sentence plain English spending summary for ${data.month}. 
Total spent: $${data.totalSpent.toFixed(2)} across ${data.receiptCount} receipts. 
Top category: ${data.topCategory}. Top merchant: ${data.topMerchant}.
Be concise and friendly. Just the summary, no extra text.`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') return '';
  return content.text.trim();
}
