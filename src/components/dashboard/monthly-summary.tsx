'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import type { CategoryTotal, MerchantTotal } from '@/lib/receipts/stats';

export function MonthlySummary(props: {
  month: string;
  total: number;
  receiptCount: number;
  topCategory: CategoryTotal | null;
  topMerchant: MerchantTotal | null;
  currency: string;
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aborted = false;
    setLoading(true);
    fetch('/api/dashboard/summary')
      .then((r) => r.json())
      .then((data) => {
        if (!aborted) setSummary(data?.summary ?? null);
      })
      .catch(() => {
        if (!aborted) setSummary(null);
      })
      .finally(() => {
        if (!aborted) setLoading(false);
      });
    return () => {
      aborted = true;
    };
  }, []);

  const fallback =
    props.receiptCount === 0
      ? `No receipts logged for ${props.month} yet.`
      : `This month you spent ${formatCurrency(props.total, props.currency)} across ${
          props.receiptCount
        } ${props.receiptCount === 1 ? 'receipt' : 'receipts'}.${
          props.topCategory
            ? ` ${props.topCategory.category} was your biggest category at ${formatCurrency(
                props.topCategory.total,
                props.currency,
              )}.`
            : ''
        }${props.topMerchant ? ` ${props.topMerchant.merchant} was your most visited merchant.` : ''}`;

  return (
    <div className="rounded-xl border bg-gradient-to-br from-primary/5 via-card to-card p-5">
      <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
        <Sparkles className="h-4 w-4" />
        AI summary
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ) : (
        <p className="text-base leading-relaxed">{summary ?? fallback}</p>
      )}
    </div>
  );
}
