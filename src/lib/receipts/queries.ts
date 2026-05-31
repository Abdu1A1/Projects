import type { Receipt } from '@/lib/types';

export interface ReceiptFilter {
  q?: string;
  category?: string;
  flag?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  sort?: 'date' | 'total' | 'merchant' | 'category';
  order?: 'asc' | 'desc';
}

function parseAmountFromQuery(q: string): { gt?: number; lt?: number; clean: string } {
  const m = q.match(/(over|under|>|<)\s*\$?(\d+(?:\.\d+)?)/i);
  if (!m) return { clean: q };
  const op = m[1].toLowerCase();
  const value = parseFloat(m[2]);
  const isOver = op === 'over' || op === '>';
  const clean = q.replace(m[0], '').trim();
  return isOver ? { gt: value, clean } : { lt: value, clean };
}

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

function parseMonthFromQuery(q: string): { from?: string; to?: string; clean: string } {
  const lower = q.toLowerCase();
  for (let i = 0; i < MONTHS.length; i++) {
    const re = new RegExp(`\\b${MONTHS[i]}\\b`, 'i');
    if (re.test(lower)) {
      const yearMatch = q.match(/\b(20\d{2})\b/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      const month = i + 1;
      const last = new Date(year, month, 0).getDate();
      const pad = (n: number) => String(n).padStart(2, '0');
      const from = `${year}-${pad(month)}-01`;
      const to = `${year}-${pad(month)}-${pad(last)}`;
      const clean = q.replace(re, '').replace(yearMatch?.[0] ?? '', '').trim();
      return { from, to, clean };
    }
  }
  return { clean: q };
}

export async function fetchReceipts(
  supabase: any,
  userId: string,
  filter: ReceiptFilter,
): Promise<Receipt[]> {
  let query = supabase
    .from('receipts')
    .select('*, line_items(*), tags(*)')
    .eq('user_id', userId);

  let q = filter.q?.trim() ?? '';
  let extraGt: number | undefined;
  let extraLt: number | undefined;
  let extraFrom: string | undefined;
  let extraTo: string | undefined;

  if (q) {
    const amt = parseAmountFromQuery(q);
    extraGt = amt.gt;
    extraLt = amt.lt;
    q = amt.clean;
    const month = parseMonthFromQuery(q);
    extraFrom = month.from;
    extraTo = month.to;
    q = month.clean;
  }

  if (q) {
    const tokens = q
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => t.replace(/[^\p{L}\p{N}_-]/gu, ''))
      .filter(Boolean);
    if (tokens.length) {
      const tsquery = tokens.map((t) => `${t}:*`).join(' & ');
      query = query.textSearch('search_vector', tsquery, { type: 'tsquery' });
    }
  }

  if (filter.category) query = query.eq('category', filter.category);
  if (filter.flag) query = query.contains('flags', [filter.flag]);
  if (filter.dateFrom) query = query.gte('date', filter.dateFrom);
  if (filter.dateTo) query = query.lte('date', filter.dateTo);
  if (extraFrom) query = query.gte('date', extraFrom);
  if (extraTo) query = query.lte('date', extraTo);
  const minAmount = filter.minAmount ?? extraGt;
  const maxAmount = filter.maxAmount ?? extraLt;
  if (minAmount !== undefined) query = query.gte('total', minAmount);
  if (maxAmount !== undefined) query = query.lte('total', maxAmount);

  const sort = filter.sort ?? 'date';
  const ascending = filter.order === 'asc';
  query = query.order(sort, { ascending, nullsFirst: false });

  const { data, error } = await query.limit(500);
  if (error) throw error;
  return (data ?? []) as Receipt[];
}

export async function fetchReceiptById(
  supabase: any,
  userId: string,
  id: string,
): Promise<Receipt | null> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*, line_items(*), tags(*)')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as Receipt) ?? null;
}

export async function findDuplicate(
  supabase: any,
  userId: string,
  receipt: Receipt,
): Promise<Receipt | null> {
  if (!receipt.merchant || receipt.total === null || !receipt.date) return null;
  const { data } = await supabase
    .from('receipts')
    .select('*, line_items(*), tags(*)')
    .eq('user_id', userId)
    .neq('id', receipt.id)
    .ilike('merchant', receipt.merchant)
    .limit(10);
  if (!data) return null;
  const total = receipt.total;
  return (
    (data as Receipt[]).find(
      (r) => typeof r.total === 'number' && Math.abs((r.total as number) - total) < 0.01,
    ) ?? null
  );
}
