import Anthropic from '@anthropic-ai/sdk';
import type { ExtractedReceipt } from './types';

const MODEL = 'claude-sonnet-4-20250514';

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export const RECEIPT_SYSTEM_PROMPT = `You are a receipt parser. Extract all data from the receipt image and return ONLY valid JSON with this exact structure. Never add explanation. If a field is unreadable return null. Never guess totals.

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

export interface UserCorrection {
  merchant: string | null;
  original_category: string | null;
  corrected_category: string | null;
}

function buildFewShotBlock(corrections: UserCorrection[]): string {
  if (!corrections.length) return '';
  const lines = corrections
    .slice(0, 8)
    .map(
      (c) =>
        `- When the merchant is "${c.merchant ?? 'unknown'}" the user previously corrected the category from "${c.original_category ?? 'none'}" to "${c.corrected_category}". Prefer "${c.corrected_category}" for similar receipts.`,
    )
    .join('\n');
  return `\n\nPrior corrections from this user (use as priority guidance when assigning the category):\n${lines}`;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in response');
  return JSON.parse(candidate.slice(start, end + 1));
}

function coerce(data: any): ExtractedReceipt {
  const number = (v: any): number | null => {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : null;
  };
  const str = (v: any): string | null => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    return s.length ? s : null;
  };
  const items = Array.isArray(data?.line_items)
    ? data.line_items
        .map((li: any) => ({
          name: str(li?.name) ?? '',
          qty: number(li?.qty) ?? 1,
          price: number(li?.price) ?? 0,
        }))
        .filter((li: any) => li.name)
    : [];
  const flags = Array.isArray(data?.flags)
    ? Array.from(new Set(data.flags.map((f: any) => String(f)))).filter(Boolean)
    : [];
  const confidence = number(data?.confidence) ?? 0;
  return {
    merchant: str(data?.merchant),
    date: str(data?.date),
    time: str(data?.time),
    total: number(data?.total),
    tax: number(data?.tax),
    currency: str(data?.currency) ?? 'CAD',
    payment_method: str(data?.payment_method),
    category: (str(data?.category) as any) ?? null,
    line_items: items,
    summary: str(data?.summary) ?? '',
    flags: flags as any,
    confidence: Math.max(0, Math.min(1, confidence)),
  };
}

export async function extractReceipt(
  imageUrl: string,
  mediaType: string,
  corrections: UserCorrection[] = [],
): Promise<ExtractedReceipt> {
  const anthropic = getClient();
  const system = RECEIPT_SYSTEM_PROMPT + buildFewShotBlock(corrections);

  const isPdf = mediaType === 'application/pdf';

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system,
    messages: [
      {
        role: 'user',
        content: [
          isPdf
            ? ({
                type: 'document',
                source: { type: 'url', url: imageUrl },
              } as any)
            : ({
                type: 'image',
                source: { type: 'url', url: imageUrl },
              } as any),
          {
            type: 'text',
            text: 'Extract the receipt as JSON only.',
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((c) => c.type === 'text') as any;
  if (!textBlock) throw new Error('Empty response from Claude');
  const parsed = extractJson(textBlock.text);
  return coerce(parsed);
}

export async function generateMonthlySummary(stats: {
  month: string;
  total: number;
  receiptCount: number;
  topCategory: { name: string; total: number } | null;
  topMerchant: { name: string; visits: number } | null;
  currency: string;
}): Promise<string> {
  const anthropic = getClient();
  const userPrompt = `Write a 2-3 sentence plain English spending summary for the user based on these stats. Be friendly, factual, and concise. Do not invent data not provided.

Month: ${stats.month}
Currency: ${stats.currency}
Total spent: ${stats.total.toFixed(2)}
Receipts: ${stats.receiptCount}
Top category: ${stats.topCategory ? `${stats.topCategory.name} (${stats.topCategory.total.toFixed(2)})` : 'none'}
Top merchant: ${stats.topMerchant ? `${stats.topMerchant.name} (${stats.topMerchant.visits} visits)` : 'none'}

Return only the summary text. No preamble.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 200,
    messages: [{ role: 'user', content: userPrompt }],
  });
  const textBlock = response.content.find((c) => c.type === 'text') as any;
  return (textBlock?.text ?? '').trim();
}
