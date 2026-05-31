import Link from 'next/link';
import { Camera, Receipt as ReceiptIcon, TrendingUp, Trophy } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { computeDashboardStats } from '@/lib/receipts/stats';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardCharts } from '@/components/dashboard/charts';
import { MonthlySummary } from '@/components/dashboard/monthly-summary';
import type { Receipt } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Dashboard · ReceiptAI' };

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const sixtyAgo = new Date();
  sixtyAgo.setDate(sixtyAgo.getDate() - 60);

  const { data } = await supabase
    .from('receipts')
    .select('*, line_items(*)')
    .eq('user_id', user.id)
    .gte('date', sixtyAgo.toISOString().slice(0, 10))
    .order('date', { ascending: false })
    .limit(500);

  const receipts = (data as Receipt[] | null) ?? [];
  const stats = computeDashboardStats(receipts);
  const now = new Date();
  const monthName = now.toLocaleString('en-CA', { month: 'long', year: 'numeric' });

  if (receipts.length === 0) {
    return (
      <div className="container py-10">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        </header>
        <div className="rounded-xl border border-dashed bg-card p-12 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Camera className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-semibold">No receipts yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the camera to add your first one — your dashboard will fill in automatically.
          </p>
          <Button asChild className="mt-4">
            <Link href="/upload">Add a receipt</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 md:py-10 space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">{monthName}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/library">All receipts</Link>
          </Button>
          <Button asChild>
            <Link href="/upload">
              <Camera className="mr-1 h-4 w-4" /> Add receipt
            </Link>
          </Button>
        </div>
      </header>

      <MonthlySummary
        month={monthName}
        total={stats.monthTotal}
        receiptCount={stats.monthReceiptCount}
        topCategory={stats.topCategory}
        topMerchant={stats.topMerchant}
        currency={stats.currency}
      />

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Spent this month"
          value={formatCurrency(stats.monthTotal, stats.currency)}
          icon={TrendingUp}
        />
        <StatCard
          label="Top category"
          value={stats.topCategory?.category ?? '—'}
          sub={
            stats.topCategory
              ? formatCurrency(stats.topCategory.total, stats.currency)
              : undefined
          }
          icon={Trophy}
        />
        <StatCard
          label="Highest receipt"
          value={
            stats.highestReceipt
              ? formatCurrency(stats.highestReceipt.total, stats.currency)
              : '—'
          }
          sub={stats.highestReceipt?.merchant ?? undefined}
          icon={TrendingUp}
        />
        <StatCard
          label="Receipts this week"
          value={String(stats.weekReceiptCount)}
          icon={ReceiptIcon}
        />
      </div>

      <DashboardCharts stats={stats} />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: any;
}) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-bold truncate">{value}</div>
        {sub && <div className="mt-0.5 text-xs text-muted-foreground truncate">{sub}</div>}
      </CardContent>
    </Card>
  );
}
