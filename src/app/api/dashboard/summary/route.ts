import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { computeDashboardStats } from '@/lib/receipts/stats';
import { generateMonthlySummary } from '@/lib/anthropic';
import { formatCurrency } from '@/lib/utils';
import type { Receipt } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const sixtyAgo = new Date();
  sixtyAgo.setDate(sixtyAgo.getDate() - 60);

  const { data } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', sixtyAgo.toISOString().slice(0, 10))
    .limit(500);

  const receipts = (data as Receipt[] | null) ?? [];
  const stats = computeDashboardStats(receipts);
  const month = new Date().toLocaleString('en-CA', { month: 'long', year: 'numeric' });

  let summary: string;
  try {
    summary = await generateMonthlySummary({
      month,
      total: stats.monthTotal,
      receiptCount: stats.monthReceiptCount,
      topCategory: stats.topCategory
        ? { name: stats.topCategory.category, total: stats.topCategory.total }
        : null,
      topMerchant: stats.topMerchant
        ? { name: stats.topMerchant.merchant, visits: stats.topMerchant.count }
        : null,
      currency: stats.currency,
    });
  } catch (err: any) {
    summary = `This month you spent ${formatCurrency(stats.monthTotal, stats.currency)} across ${
      stats.monthReceiptCount
    } ${stats.monthReceiptCount === 1 ? 'receipt' : 'receipts'}.`;
  }

  return NextResponse.json({ summary });
}
