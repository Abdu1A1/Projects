'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Receipt, CATEGORY_COLORS } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReceiptCard } from '@/components/receipts/ReceiptCard';
import { ReceiptCardSkeleton } from '@/components/receipts/ReceiptCardSkeleton';
import { FolderOpen, ChevronRight, Calendar, Store } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface GroupedReceipts {
  [key: string]: Receipt[];
}

export default function FoldersPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'time' | 'merchant'>('time');
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/receipts?limit=500')
      .then((r) => r.json())
      .then((d) => setReceipts(d.receipts || []))
      .finally(() => setLoading(false));
  }, []);

  // Group by time: Year > Month > Category
  const byTime: GroupedReceipts = {};
  receipts.forEach((r) => {
    if (!r.date) return;
    const date = parseISO(r.date);
    const key = format(date, 'yyyy > MMMM');
    if (!byTime[key]) byTime[key] = [];
    byTime[key].push(r);
  });

  // Group by merchant
  const byMerchant: GroupedReceipts = {};
  receipts.forEach((r) => {
    const key = r.merchant || 'Unknown Merchant';
    if (!byMerchant[key]) byMerchant[key] = [];
    byMerchant[key].push(r);
  });

  // Sort
  const timeKeys = Object.keys(byTime).sort((a, b) => b.localeCompare(a));
  const merchantKeys = Object.keys(byMerchant).sort((a, b) =>
    (byMerchant[b].length - byMerchant[a].length)
  );

  const FolderItem = ({
    folderKey,
    items,
    icon: Icon,
    color,
  }: {
    folderKey: string;
    items: Receipt[];
    icon: React.ComponentType<{ className?: string; color?: string }>;
    color: string;
  }) => {
    const isOpen = openFolder === folderKey;
    const totalSpend = items.reduce((s, r) => s + (r.total || 0), 0);

    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
          onClick={() => setOpenFolder(isOpen ? null : folderKey)}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: color + '20' }}
            >
              <Icon className="w-5 h-5" color={color} />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{folderKey}</p>
              <p className="text-xs text-gray-500">
                {items.length} receipt{items.length !== 1 ? 's' : ''} ·{' '}
                ${totalSpend.toFixed(2)}
              </p>
            </div>
          </div>
          <ChevronRight
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="border-t border-gray-100 dark:border-gray-800 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {items.map((r) => (
                <ReceiptCard key={r.id} receipt={r} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Folders</h1>
        <p className="text-gray-500 text-sm mt-0.5">Browse receipts by time or merchant</p>
      </div>

      <Tabs value={activeView} onValueChange={(v) => { setActiveView(v as 'time' | 'merchant'); setOpenFolder(null); }}>
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="time" className="gap-2">
            <Calendar className="w-4 h-4" />
            By Time
          </TabsTrigger>
          <TabsTrigger value="merchant" className="gap-2">
            <Store className="w-4 h-4" />
            By Merchant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="time" className="mt-4 space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="flex items-center gap-3">
                  <ReceiptCardSkeleton />
                </div>
              </div>
            ))
          ) : timeKeys.length > 0 ? (
            timeKeys.map((key) => (
              <FolderItem
                key={key}
                folderKey={key}
                items={byTime[key]}
                icon={Calendar}
                color="#6366f1"
              />
            ))
          ) : (
            <div className="text-center py-16 text-gray-500">
              <FolderOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No receipts yet.</p>
              <Link href="/library" className="text-indigo-600 text-sm hover:underline mt-1 inline-block">
                Go to library
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="merchant" className="mt-4 space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 animate-pulse">
                <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
            ))
          ) : merchantKeys.length > 0 ? (
            merchantKeys.map((key) => {
              const items = byMerchant[key];
              const topCategory = items[0]?.category || 'Other';
              const color = CATEGORY_COLORS[topCategory] || '#94a3b8';
              return (
                <FolderItem
                  key={key}
                  folderKey={key}
                  items={items}
                  icon={Store}
                  color={color}
                />
              );
            })
          ) : (
            <div className="text-center py-16 text-gray-500">
              <FolderOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>No receipts yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
