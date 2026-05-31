import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateMonthlySummary } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
import { format, startOfMonth, endOfMonth, startOfWeek, subDays } from 'date-fns';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');
    const weekStart = format(startOfWeek(now), 'yyyy-MM-dd');
    const thirtyDaysAgo = format(subDays(now, 30), 'yyyy-MM-dd');

    // Total spent this month
    const { data: monthlyReceipts } = await supabase
      .from('receipts')
      .select('total, category, merchant')
      .eq('user_id', user.id)
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .not('total', 'is', null);

    const totalThisMonth = monthlyReceipts?.reduce((sum, r) => sum + (r.total || 0), 0) || 0;

    // Top category this month
    const categoryTotals: Record<string, number> = {};
    monthlyReceipts?.forEach((r) => {
      if (r.category) {
        categoryTotals[r.category] = (categoryTotals[r.category] || 0) + (r.total || 0);
      }
    });
    const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0]?.[0] || null;

    // Highest single receipt (all time)
    const { data: highestReceiptData } = await supabase
      .from('receipts')
      .select('total')
      .eq('user_id', user.id)
      .not('total', 'is', null)
      .order('total', { ascending: false })
      .limit(1)
      .single();

    const highestReceipt = highestReceiptData?.total || null;

    // Receipts this week
    const { count: receiptsThisWeek } = await supabase
      .from('receipts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('date', weekStart);

    // Spending by category this month (for donut chart)
    const spendingByCategory = Object.entries(categoryTotals)
      .map(([category, total]) => ({ category, total, count: 0 }))
      .sort((a, b) => b.total - a.total);

    // Add counts
    monthlyReceipts?.forEach((r) => {
      const cat = spendingByCategory.find((c) => c.category === r.category);
      if (cat) cat.count++;
    });

    // Daily spending over last 30 days (for line chart)
    const { data: last30Days } = await supabase
      .from('receipts')
      .select('date, total')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo)
      .not('total', 'is', null)
      .order('date');

    const dailyMap: Record<string, number> = {};
    last30Days?.forEach((r) => {
      if (r.date) {
        dailyMap[r.date] = (dailyMap[r.date] || 0) + (r.total || 0);
      }
    });

    const dailySpending = Object.entries(dailyMap)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top 5 merchants (all time)
    const { data: allReceipts } = await supabase
      .from('receipts')
      .select('merchant, total')
      .eq('user_id', user.id)
      .not('merchant', 'is', null)
      .not('total', 'is', null);

    const merchantTotals: Record<string, { total: number; count: number }> = {};
    allReceipts?.forEach((r) => {
      if (r.merchant) {
        if (!merchantTotals[r.merchant]) {
          merchantTotals[r.merchant] = { total: 0, count: 0 };
        }
        merchantTotals[r.merchant].total += r.total || 0;
        merchantTotals[r.merchant].count++;
      }
    });

    const topMerchants = Object.entries(merchantTotals)
      .map(([merchant, data]) => ({ merchant, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Generate AI monthly summary
    let monthlyAISummary: string | null = null;
    if (monthlyReceipts && monthlyReceipts.length > 0 && topCategory) {
      const topMerchantName = topMerchants[0]?.merchant || 'Unknown';
      try {
        monthlyAISummary = await generateMonthlySummary({
          totalSpent: totalThisMonth,
          receiptCount: monthlyReceipts.length,
          topCategory,
          topMerchant: topMerchantName,
          month: format(now, 'MMMM yyyy'),
        });
      } catch {
        // Non-critical: skip if AI summary fails
      }
    }

    return NextResponse.json({
      stats: {
        totalThisMonth,
        topCategory,
        highestReceipt,
        receiptsThisWeek: receiptsThisWeek || 0,
        monthlyAISummary,
      },
      charts: {
        spendingByCategory,
        dailySpending,
        topMerchants,
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
