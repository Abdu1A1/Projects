'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Camera, Filter, Search, SortAsc, SortDesc, X, Download } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReceiptCard } from '@/components/receipt/receipt-card';
import { CATEGORIES, FLAG_META } from '@/lib/constants';
import type { Receipt } from '@/lib/types';
import type { ReceiptFilter } from '@/lib/receipts/queries';
import { cn } from '@/lib/utils';

export function LibraryView({
  receipts,
  initialFilter,
}: {
  receipts: Receipt[];
  initialFilter: ReceiptFilter;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(initialFilter.q ?? '');
  const [showFilters, setShowFilters] = useState(false);

  const setParam = useCallback(
    (updates: Record<string, string | number | undefined | null>) => {
      const params = new URLSearchParams(search.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === null || v === '') params.delete(k);
        else params.set(k, String(v));
      }
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [pathname, router, search],
  );

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam({ q: q || undefined });
  };

  const sort = initialFilter.sort ?? 'date';
  const order = initialFilter.order ?? 'desc';

  const activeChips = useMemo(() => {
    const chips: { label: string; clear: () => void }[] = [];
    if (initialFilter.category)
      chips.push({
        label: `Category: ${initialFilter.category}`,
        clear: () => setParam({ category: undefined }),
      });
    if (initialFilter.flag)
      chips.push({
        label: `Flag: ${initialFilter.flag}`,
        clear: () => setParam({ flag: undefined }),
      });
    if (initialFilter.dateFrom)
      chips.push({
        label: `From: ${initialFilter.dateFrom}`,
        clear: () => setParam({ from: undefined }),
      });
    if (initialFilter.dateTo)
      chips.push({ label: `To: ${initialFilter.dateTo}`, clear: () => setParam({ to: undefined }) });
    if (initialFilter.minAmount)
      chips.push({
        label: `≥ $${initialFilter.minAmount}`,
        clear: () => setParam({ min: undefined }),
      });
    if (initialFilter.maxAmount)
      chips.push({
        label: `≤ $${initialFilter.maxAmount}`,
        clear: () => setParam({ max: undefined }),
      });
    return chips;
  }, [initialFilter, setParam]);

  function exportCsv() {
    const params = new URLSearchParams(search.toString());
    window.location.href = `/api/export/csv?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={onSearch} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Search: "costco", "gas april", "over $100"'
            className="pl-9"
          />
        </form>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters((s) => !s)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" /> Filters
          </Button>
          <Select
            value={sort}
            onValueChange={(v) => setParam({ sort: v })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="total">Total</SelectItem>
              <SelectItem value="merchant">Merchant</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setParam({ order: order === 'asc' ? 'desc' : 'asc' })}
            aria-label="Toggle order"
          >
            {order === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
          <Button variant="outline" onClick={exportCsv} className="gap-2">
            <Download className="h-4 w-4" /> CSV
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="rounded-lg border bg-card p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            label="Category"
            value={initialFilter.category}
            onChange={(v) => setParam({ category: v })}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <FilterSelect
            label="Flag"
            value={initialFilter.flag}
            onChange={(v) => setParam({ flag: v })}
            options={Object.entries(FLAG_META).map(([k, v]) => ({ value: k, label: v.label }))}
          />
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Date from</label>
            <Input
              type="date"
              defaultValue={initialFilter.dateFrom ?? ''}
              onBlur={(e) => setParam({ from: e.target.value || undefined })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Date to</label>
            <Input
              type="date"
              defaultValue={initialFilter.dateTo ?? ''}
              onBlur={(e) => setParam({ to: e.target.value || undefined })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Min total</label>
            <Input
              type="number"
              step="0.01"
              defaultValue={initialFilter.minAmount ?? ''}
              onBlur={(e) => setParam({ min: e.target.value || undefined })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Max total</label>
            <Input
              type="number"
              step="0.01"
              defaultValue={initialFilter.maxAmount ?? ''}
              onBlur={(e) => setParam({ max: e.target.value || undefined })}
            />
          </div>
        </div>
      )}

      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((c) => (
            <button
              key={c.label}
              onClick={c.clear}
              className="inline-flex items-center gap-1 rounded-full border bg-secondary px-3 py-1 text-xs hover:bg-secondary/80"
            >
              {c.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            onClick={() => router.push(pathname)}
            className="text-xs text-muted-foreground hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      {receipts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {receipts.map((r) => (
            <ReceiptCard key={r.id} receipt={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value?: string;
  onChange: (v: string | undefined) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value ?? 'all'} onValueChange={(v) => onChange(v === 'all' ? undefined : v)}>
        <SelectTrigger>
          <SelectValue placeholder={`All ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed bg-card p-12 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
        <Camera className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-semibold">No receipts yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Tap the camera button to add your first one.
      </p>
      <Button asChild className="mt-4">
        <Link href="/upload">Add a receipt</Link>
      </Button>
    </div>
  );
}
