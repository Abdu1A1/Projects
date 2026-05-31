import type { ExtractedReceipt, Flag } from '@/lib/types';

const FLAG_SET = new Set<Flag>([
  'high_tax',
  'possible_duplicate',
  'refund_detected',
  'missing_total',
  'suspicious_charge',
  'low_confidence',
]);

export function postProcessFlags(extracted: ExtractedReceipt): ExtractedReceipt {
  const flags = new Set<Flag>((extracted.flags ?? []).filter((f): f is Flag => FLAG_SET.has(f as Flag)));

  const total = extracted.total;
  const tax = extracted.tax;
  const items = extracted.line_items ?? [];

  if (total === null) flags.add('missing_total');
  if (total !== null && total < 0) flags.add('refund_detected');
  if (typeof extracted.confidence === 'number' && extracted.confidence < 0.7)
    flags.add('low_confidence');
  if (total !== null && tax !== null) {
    const subtotal = total - tax;
    if (subtotal > 0 && tax / subtotal > 0.2) flags.add('high_tax');
  }
  if (total !== null && items.length) {
    const maxItem = Math.max(...items.map((i) => Math.abs(Number(i.price) || 0)));
    if (Math.abs(total) > 0 && maxItem / Math.abs(total) > 0.8 && items.length > 1)
      flags.add('suspicious_charge');
  }

  return { ...extracted, flags: Array.from(flags) };
}

export async function detectDuplicates(
  supabase: any,
  userId: string,
  extracted: ExtractedReceipt,
): Promise<boolean> {
  if (!extracted.merchant || extracted.total === null || !extracted.date) return false;
  const date = new Date(extracted.date);
  const dayBefore = new Date(date);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const dayAfter = new Date(date);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const { data } = await supabase
    .from('receipts')
    .select('id, merchant, total, date')
    .eq('user_id', userId)
    .ilike('merchant', extracted.merchant)
    .gte('date', dayBefore.toISOString().slice(0, 10))
    .lte('date', dayAfter.toISOString().slice(0, 10))
    .limit(5);

  if (!data || !data.length) return false;
  return data.some(
    (r: any) =>
      typeof r.total === 'number' &&
      extracted.total !== null &&
      Math.abs(r.total - (extracted.total as number)) < 0.01,
  );
}
