'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Receipt, FilterState, FlagType, CATEGORIES } from '@/types';
import { ReceiptCard } from '@/components/receipts/ReceiptCard';
import { ReceiptCardSkeleton } from '@/components/receipts/ReceiptCardSkeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Search,
  SlidersHorizontal,
  X,
  ReceiptText,
} from 'lucide-react';
import { Suspense } from 'react';

const FLAG_OPTIONS: FlagType[] = [
  'high_tax',
  'possible_duplicate',
  'refund_detected',
  'missing_total',
  'suspicious_charge',
  'low_confidence',
];

const FLAG_LABELS: Record<FlagType, string> = {
  high_tax: 'High Tax',
  possible_duplicate: 'Possible Duplicate',
  refund_detected: 'Refund',
  missing_total: 'Missing Total',
  suspicious_charge: 'Suspicious',
  low_confidence: 'Low Confidence',
};

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
    amountMin: searchParams.get('amountMin') || '',
    amountMax: searchParams.get('amountMax') || '',
    flags: (searchParams.getAll('flags') as FlagType[]) || [],
    sortBy: (searchParams.get('sortBy') as FilterState['sortBy']) || 'date',
    sortOrder: (searchParams.get('sortOrder') as FilterState['sortOrder']) || 'desc',
  });

  const searchTimeout = useRef<NodeJS.Timeout>();

  const buildQueryString = useCallback((f: FilterState) => {
    const params = new URLSearchParams();
    if (f.search) params.set('search', f.search);
    if (f.category) params.set('category', f.category);
    if (f.dateFrom) params.set('dateFrom', f.dateFrom);
    if (f.dateTo) params.set('dateTo', f.dateTo);
    if (f.amountMin) params.set('amountMin', f.amountMin);
    if (f.amountMax) params.set('amountMax', f.amountMax);
    f.flags.forEach((flag) => params.append('flags', flag));
    params.set('sortBy', f.sortBy);
    params.set('sortOrder', f.sortOrder);
    return params.toString();
  }, []);

  const fetchReceipts = useCallback(async (f: FilterState) => {
    setLoading(true);
    try {
      const qs = buildQueryString(f);
      const response = await fetch(`/api/receipts?${qs}`);
      const data = await response.json();
      setReceipts(data.receipts || []);
      setCount(data.count || 0);
    } catch {
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  useEffect(() => {
    fetchReceipts(filters);
    // Sync to URL
    const qs = buildQueryString(filters);
    router.replace(`/library?${qs}`, { scroll: false });
  }, [filters, fetchReceipts, buildQueryString, router]);

  const handleSearchChange = (value: string) => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: value }));
    }, 300);
  };

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleFlag = (flag: FlagType) => {
    setFilters((prev) => ({
      ...prev,
      flags: prev.flags.includes(flag)
        ? prev.flags.filter((f) => f !== flag)
        : [...prev.flags, flag],
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
      flags: [],
      sortBy: 'date',
      sortOrder: 'desc',
    });
  };

  const activeFilterCount = [
    filters.category,
    filters.dateFrom,
    filters.dateTo,
    filters.amountMin,
    filters.amountMax,
    ...filters.flags,
  ].filter(Boolean).length;

  const FilterPanel = () => (
    <div className="space-y-5">
      {/* Category */}
      <div>
        <Label className="text-sm font-medium">Category</Label>
        <Select
          value={filters.category || 'all'}
          onValueChange={(v) => updateFilter('category', (v === 'all' ? '' : v) as string)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date range */}
      <div>
        <Label className="text-sm font-medium">Date Range</Label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
            placeholder="From"
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
            placeholder="To"
          />
        </div>
      </div>

      {/* Amount range */}
      <div>
        <Label className="text-sm font-medium">Amount Range</Label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <Input
            type="number"
            value={filters.amountMin}
            onChange={(e) => updateFilter('amountMin', e.target.value)}
            placeholder="Min $"
          />
          <Input
            type="number"
            value={filters.amountMax}
            onChange={(e) => updateFilter('amountMax', e.target.value)}
            placeholder="Max $"
          />
        </div>
      </div>

      {/* Flags */}
      <div>
        <Label className="text-sm font-medium">Flags</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {FLAG_OPTIONS.map((flag) => (
            <button
              key={flag}
              onClick={() => toggleFlag(flag)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium border transition-colors ${
                filters.flags.includes(flag)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-indigo-400'
              }`}
            >
              {FLAG_LABELS[flag]}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <Label className="text-sm font-medium">Sort by</Label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <Select
            value={filters.sortBy}
            onValueChange={(v) => updateFilter('sortBy', v as FilterState['sortBy'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="total">Amount</SelectItem>
              <SelectItem value="merchant">Merchant</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.sortOrder}
            onValueChange={(v) => updateFilter('sortOrder', v as FilterState['sortOrder'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest first</SelectItem>
              <SelectItem value="asc">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="outline" onClick={clearFilters} className="w-full gap-2">
          <X className="w-4 h-4" />
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Receipt Library</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {loading ? 'Loading...' : `${count} receipt${count !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="search"
            defaultValue={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder='Search receipts... e.g. "gas april", "costco", "milk"'
            className="pl-9"
          />
        </div>

        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger className="inline-flex items-center gap-2 flex-shrink-0 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <Badge className="bg-indigo-600 text-white text-xs w-5 h-5 p-0 flex items-center justify-center rounded-full">
                  {activeFilterCount}
                </Badge>
              )}
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter & Sort</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterPanel />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.category && (
            <Badge variant="outline" className="gap-1 text-xs">
              {filters.category}
              <button onClick={() => updateFilter('category', '')}><X className="w-3 h-3" /></button>
            </Badge>
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <Badge variant="outline" className="gap-1 text-xs">
              {filters.dateFrom || '...'} → {filters.dateTo || '...'}
              <button onClick={() => { updateFilter('dateFrom', ''); updateFilter('dateTo', ''); }}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {(filters.amountMin || filters.amountMax) && (
            <Badge variant="outline" className="gap-1 text-xs">
              ${filters.amountMin || '0'} - ${filters.amountMax || '∞'}
              <button onClick={() => { updateFilter('amountMin', ''); updateFilter('amountMax', ''); }}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filters.flags.map((flag) => (
            <Badge key={flag} variant="outline" className="gap-1 text-xs">
              {FLAG_LABELS[flag]}
              <button onClick={() => toggleFlag(flag)}><X className="w-3 h-3" /></button>
            </Badge>
          ))}
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <ReceiptCardSkeleton key={i} />
          ))}
        </div>
      ) : receipts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {receipts.map((receipt) => (
            <ReceiptCard key={receipt.id} receipt={receipt} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
            <ReceiptText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
            {activeFilterCount > 0 ? 'No receipts match your filters' : 'No receipts yet'}
          </h3>
          <p className="text-gray-500 text-sm max-w-xs">
            {activeFilterCount > 0
              ? 'Try adjusting your search or removing some filters.'
              : 'Tap the camera button to add your first receipt.'}
          </p>
          {activeFilterCount > 0 && (
            <Button variant="outline" onClick={clearFilters} className="mt-4 gap-2">
              <X className="w-4 h-4" />
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={
      <div className="p-6 max-w-7xl mx-auto">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ReceiptCardSkeleton key={i} />
          ))}
        </div>
      </div>
    }>
      <LibraryContent />
    </Suspense>
  );
}
