'use client';

import { useEffect, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { SpendingCharts } from '@/components/dashboard/SpendingCharts';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign,
  Tag,
  TrendingUp,
  ReceiptText,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { SpendingByCategory, DailySpending, MerchantSpending } from '@/types';
import { format } from 'date-fns';

interface DashboardData {
  stats: {
    totalThisMonth: number;
    topCategory: string | null;
    highestReceipt: number | null;
    receiptsThisWeek: number;
    monthlyAISummary: string | null;
  };
  charts: {
    spendingByCategory: SpendingByCategory[];
    dailySpending: DailySpending[];
    topMerchants: MerchantSpending[];
  };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value);

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const currentMonth = format(new Date(), 'MMMM yyyy');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{currentMonth}</p>
      </div>

      {/* AI Monthly Summary */}
      {loading ? (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 w-full">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      ) : data?.stats.monthlyAISummary ? (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <p className="text-indigo-900 dark:text-indigo-100 text-sm leading-relaxed">
              {data.stats.monthlyAISummary}
            </p>
          </div>
        </div>
      ) : data && !data.stats.monthlyAISummary ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-gray-400" />
            <p className="text-gray-500 text-sm">
              Upload some receipts to get your AI monthly summary.
            </p>
          </div>
        </div>
      ) : null}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-200 dark:border-red-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Spent This Month"
          value={data ? formatCurrency(data.stats.totalThisMonth) : '$0.00'}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBg="bg-green-100 dark:bg-green-900/30"
          loading={loading}
        />
        <StatCard
          title="Top Category"
          value={data?.stats.topCategory || '—'}
          subtitle="this month"
          icon={Tag}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-100 dark:bg-indigo-900/30"
          loading={loading}
        />
        <StatCard
          title="Highest Receipt"
          value={data?.stats.highestReceipt != null ? formatCurrency(data.stats.highestReceipt) : '—'}
          icon={TrendingUp}
          iconColor="text-orange-600"
          iconBg="bg-orange-100 dark:bg-orange-900/30"
          loading={loading}
        />
        <StatCard
          title="This Week"
          value={data ? `${data.stats.receiptsThisWeek} receipt${data.stats.receiptsThisWeek !== 1 ? 's' : ''}` : '—'}
          icon={ReceiptText}
          iconColor="text-purple-600"
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          loading={loading}
        />
      </div>

      {/* Charts */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <Skeleton className="h-5 w-40 mb-4" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : data ? (
        <SpendingCharts
          spendingByCategory={data.charts.spendingByCategory}
          dailySpending={data.charts.dailySpending}
          topMerchants={data.charts.topMerchants}
        />
      ) : null}
    </div>
  );
}
