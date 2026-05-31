import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiExtraction, CATEGORIES, FlagType } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

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

const VALID_FLAGS: FlagType[] = [
  'high_tax',
  'possible_duplicate',
  'refund_detected',
  'missing_total',
  'suspicious_charge',
  'low_confidence',
];

function buildPrompt(
  userCorrections?: Array<{ merchant: string; original_category: string; corrected_category: string }>
): string {
  let prompt = SYSTEM_PROMPT;
  if (userCorrections && userCorrections.length > 0) {
    const correctionExamples = userCorrections
      .slice(0, 5)
      .map((c) => `- ${c.merchant}: was "${c.original_category}", correct category is "${c.corrected_category}"`)
      .join('\n');
    prompt += `\n\nUser's past corrections (apply these patterns):\n${correctionExamples}`;
  }
  return prompt;
}

function parseGeminiJson(text: string): GeminiExtraction {
  let jsonStr = text.trim();
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  const parsed = JSON.parse(jsonStr) as GeminiExtraction;

  if (parsed.category && !CATEGORIES.includes(parsed.category as (typeof CATEGORIES)[number])) {
    parsed.category = 'Other';
  }

  if (typeof parsed.confidence !== 'number') {
    parsed.confidence = 0;
  }
  parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));

  parsed.flags = (parsed.flags || []).filter((f) => VALID_FLAGS.includes(f as FlagType)) as FlagType[];

  if (parsed.confidence < 0.7 && !parsed.flags.includes('low_confidence')) {
    parsed.flags.push('low_confidence');
  }

  if (parsed.total == null && !parsed.flags.includes('missing_total')) {
    parsed.flags.push('missing_total');
  }

  return parsed;
}

export async function parseReceiptWithGemini(
  imageBuffer: Buffer,
  mimeType: string,
  userCorrections?: Array<{ merchant: string; original_category: string; corrected_category: string }>
): Promise<GeminiExtraction> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: buildPrompt(userCorrections),
  });

  const base64Data = imageBuffer.toString('base64');

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    },
    { text: 'Extract all receipt data and return as JSON only.' },
  ]);

  const text = result.response.text();
  return parseGeminiJson(text);
}

export async function generateMonthlySummary(data: {
  totalSpent: number;
  receiptCount: number;
  topCategory: string;
  topMerchant: string;
  month: string;
}): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent(
    `Generate a 2-3 sentence plain English spending summary for ${data.month}. 
Total spent: $${data.totalSpent.toFixed(2)} across ${data.receiptCount} receipts. 
Top category: ${data.topCategory}. Top merchant: ${data.topMerchant}.
Be concise and friendly. Just the summary, no extra text.`
  );

  return result.response.text().trim();
}
