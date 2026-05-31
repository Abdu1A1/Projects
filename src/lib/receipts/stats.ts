import type { Receipt } from '@/lib/types';

export interface DailySpending {
  date: string;
  total: number;
}

export interface CategoryTotal {
  category: string;
  total: number;
}

export interface MerchantTotal {
  merchant: string;
  total: number;
  count: number;
}

export interface DashboardStats {
  monthTotal: number;
  monthReceiptCount: number;
  weekReceiptCount: number;
  highestReceipt: Receipt | null;
  topCategory: CategoryTotal | null;
  topMerchant: MerchantTotal | null;
  byCategory: CategoryTotal[];
  byDay: DailySpending[];
  topMerchants: MerchantTotal[];
  currency: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function computeDashboardStats(receipts: Receipt[], now = new Date()): DashboardStats {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const thirtyAgo = new Date(now);
  thirtyAgo.setDate(now.getDate() - 30);

  const inMonth = receipts.filter((r) => r.date && new Date(r.date) >= monthStart);
  const inWeek = receipts.filter((r) => r.date && new Date(r.date) >= weekStart);

  const monthTotal = inMonth.reduce((acc, r) => acc + (Number(r.total) || 0), 0);

  const highestReceipt =
    inMonth
      .filter((r) => typeof r.total === 'number')
      .sort((a, b) => Math.abs(Number(b.total)) - Math.abs(Number(a.total)))[0] ?? null;

  const byCategoryMap = new Map<string, number>();
  inMonth.forEach((r) => {
    const c = r.category ?? 'Other';
    byCategoryMap.set(c, (byCategoryMap.get(c) ?? 0) + (Number(r.total) || 0));
  });
  const byCategory: CategoryTotal[] = Array.from(byCategoryMap.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const merchantMap = new Map<string, { total: number; count: number }>();
  inMonth.forEach((r) => {
    const m = r.merchant ?? 'Unknown';
    const cur = merchantMap.get(m) ?? { total: 0, count: 0 };
    cur.total += Number(r.total) || 0;
    cur.count += 1;
    merchantMap.set(m, cur);
  });
  const topMerchants: MerchantTotal[] = Array.from(merchantMap.entries())
    .map(([merchant, v]) => ({ merchant, total: v.total, count: v.count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const dayMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyAgo);
    d.setDate(thirtyAgo.getDate() + i);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    dayMap.set(key, 0);
  }
  receipts.forEach((r) => {
    if (!r.date) return;
    const d = new Date(r.date);
    if (d < thirtyAgo) return;
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (dayMap.has(key)) {
      dayMap.set(key, (dayMap.get(key) ?? 0) + (Number(r.total) || 0));
    }
  });
  const byDay: DailySpending[] = Array.from(dayMap.entries()).map(([date, total]) => ({
    date,
    total,
  }));

  const currency =
    receipts.find((r) => r.currency)?.currency ?? 'CAD';

  return {
    monthTotal,
    monthReceiptCount: inMonth.length,
    weekReceiptCount: inWeek.length,
    highestReceipt,
    topCategory: byCategory[0] ?? null,
    topMerchant: topMerchants[0] ?? null,
    byCategory,
    byDay,
    topMerchants,
    currency,
  };
}
