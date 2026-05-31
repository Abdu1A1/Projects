'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Receipt, CATEGORY_COLORS, CATEGORIES } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReceiptCard } from '@/components/receipts/ReceiptCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderOpen, ChevronRight, ChevronDown, Calendar, Store, Tag, Plus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

interface GroupedReceipts {
  [key: string]: Receipt[];
}

interface NestedTimeFolders {
  [year: string]: {
    [month: string]: {
      [category: string]: Receipt[];
    };
  };
}

interface CategoryRecord {
  id: string;
  name: string;
  is_custom: boolean;
}

export default function FoldersPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [customCategories, setCustomCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'time' | 'merchant' | 'category'>('time');
  const [openYear, setOpenYear] = useState<string | null>(null);
  const [openMonth, setOpenMonth] = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [openMerchant, setOpenMerchant] = useState<string | null>(null);
  const [openCustomFolder, setOpenCustomFolder] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/receipts?limit=500').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
    ])
      .then(([receiptsData, categoriesData]) => {
        setReceipts(receiptsData.receipts || []);
        setCustomCategories((categoriesData.categories || []).filter((c: CategoryRecord) => c.is_custom));
      })
      .finally(() => setLoading(false));
  }, []);

  const byTime: NestedTimeFolders = {};
  receipts.forEach((r) => {
    if (!r.date) return;
    const date = parseISO(r.date);
    const year = format(date, 'yyyy');
    const month = format(date, 'MMMM');
    const category = r.category || 'Other';
    if (!byTime[year]) byTime[year] = {};
    if (!byTime[year][month]) byTime[year][month] = {};
    if (!byTime[year][month][category]) byTime[year][month][category] = [];
    byTime[year][month][category].push(r);
  });

  const byMerchant: GroupedReceipts = {};
  receipts.forEach((r) => {
    const key = r.merchant || 'Unknown Merchant';
    if (!byMerchant[key]) byMerchant[key] = [];
    byMerchant[key].push(r);
  });

  const byCategory: GroupedReceipts = {};
  receipts.forEach((r) => {
    const key = r.category || 'Other';
    if (!byCategory[key]) byCategory[key] = [];
    byCategory[key].push(r);
  });

  const yearKeys = Object.keys(byTime).sort((a, b) => b.localeCompare(a));
  const merchantKeys = Object.keys(byMerchant).sort((a, b) => byMerchant[b].length - byMerchant[a].length);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCustomCategories((prev) => [...prev, data.category]);
      setNewCategoryName('');
      toast.success('Custom folder created');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setCreatingCategory(false);
    }
  };

  const ReceiptGrid = ({ items }: { items: Receipt[] }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
      {items.map((r) => (
        <ReceiptCard key={r.id} receipt={r} />
      ))}
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Folders</h1>
        <p className="text-gray-500 text-sm mt-0.5">Browse receipts by time, merchant, or category</p>
      </div>

      <Tabs
        value={activeView}
        onValueChange={(v) => {
          setActiveView(v as 'time' | 'merchant' | 'category');
          setOpenYear(null);
          setOpenMonth(null);
          setOpenCategory(null);
          setOpenMerchant(null);
          setOpenCustomFolder(null);
        }}
      >
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="time" className="gap-1.5 text-xs sm:text-sm">
            <Calendar className="w-4 h-4" />
            By Time
          </TabsTrigger>
          <TabsTrigger value="merchant" className="gap-1.5 text-xs sm:text-sm">
            <Store className="w-4 h-4" />
            By Merchant
          </TabsTrigger>
          <TabsTrigger value="category" className="gap-1.5 text-xs sm:text-sm">
            <Tag className="w-4 h-4" />
            By Category
          </TabsTrigger>
        </TabsList>

        <TabsContent value="time" className="mt-4 space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))
          ) : yearKeys.length > 0 ? (
            yearKeys.map((year) => (
              <div key={year} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  onClick={() => setOpenYear(openYear === year ? null : year)}
                >
                  <div className="flex items-center gap-3">
                    {openYear === year ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    <span className="font-semibold text-gray-900 dark:text-white">{year}</span>
                  </div>
                </button>

                {openYear === year && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-4 space-y-2">
                    {Object.keys(byTime[year])
                      .sort((a, b) => new Date(`${a} 1, ${year}`).getMonth() - new Date(`${b} 1, ${year}`).getMonth())
                      .reverse()
                      .map((month) => {
                        const monthKey = `${year}-${month}`;
                        const categories = byTime[year][month];
                        const monthCount = Object.values(categories).flat().length;

                        return (
                          <div key={monthKey} className="ml-4">
                            <button
                              className="w-full flex items-center justify-between py-2 hover:text-indigo-600 text-left"
                              onClick={() => setOpenMonth(openMonth === monthKey ? null : monthKey)}
                            >
                              <div className="flex items-center gap-2">
                                {openMonth === monthKey ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                <span className="font-medium text-sm">{month}</span>
                                <span className="text-xs text-gray-500">({monthCount})</span>
                              </div>
                            </button>

                            {openMonth === monthKey && (
                              <div className="ml-6 space-y-2">
                                {Object.keys(categories)
                                  .sort()
                                  .map((category) => {
                                    const catKey = `${monthKey}-${category}`;
                                    const items = categories[category];
                                    const color = CATEGORY_COLORS[category] || '#94a3b8';

                                    return (
                                      <div key={catKey}>
                                        <button
                                          className="w-full flex items-center justify-between py-2 text-left"
                                          onClick={() => setOpenCategory(openCategory === catKey ? null : catKey)}
                                        >
                                          <div className="flex items-center gap-2">
                                            {openCategory === catKey ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                            <span
                                              className="text-xs font-semibold px-2 py-0.5 rounded text-white"
                                              style={{ backgroundColor: color }}
                                            >
                                              {category}
                                            </span>
                                            <span className="text-xs text-gray-500">({items.length})</span>
                                          </div>
                                        </button>
                                        {openCategory === catKey && <ReceiptGrid items={items} />}
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            ))
          ) : (
            <EmptyState />
          )}
        </TabsContent>

        <TabsContent value="merchant" className="mt-4 space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))
          ) : merchantKeys.length > 0 ? (
            merchantKeys.map((key) => {
              const items = byMerchant[key];
              const isOpen = openMerchant === key;
              const topCategory = items[0]?.category || 'Other';
              const color = CATEGORY_COLORS[topCategory] || '#94a3b8';
              const totalSpend = items.reduce((s, r) => s + (r.total || 0), 0);

              return (
                <div key={key} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                    onClick={() => setOpenMerchant(isOpen ? null : key)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
                        <Store className="w-5 h-5" color={color} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{key}</p>
                        <p className="text-xs text-gray-500">
                          {items.length} receipt{items.length !== 1 ? 's' : ''} · ${totalSpend.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="border-t border-gray-100 dark:border-gray-800 p-4">
                      <ReceiptGrid items={items} />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <EmptyState />
          )}
        </TabsContent>

        <TabsContent value="category" className="mt-4 space-y-4">
          <div className="flex gap-2">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New custom folder name..."
              className="h-9"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
            />
            <Button
              size="sm"
              onClick={handleCreateCategory}
              disabled={creatingCategory || !newCategoryName.trim()}
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4" />
              Create
            </Button>
          </div>

          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            ))
          ) : (
            <>
              {CATEGORIES.map((cat) => {
                const items = byCategory[cat] || [];
                const isOpen = openCustomFolder === cat;
                const color = CATEGORY_COLORS[cat] || '#94a3b8';

                return (
                  <div key={cat} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                      onClick={() => setOpenCustomFolder(isOpen ? null : cat)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg text-white" style={{ backgroundColor: color }}>
                          {cat}
                        </span>
                        <span className="text-xs text-gray-500">{items.length} receipt{items.length !== 1 ? 's' : ''}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </button>
                    {isOpen && items.length > 0 && (
                      <div className="border-t border-gray-100 dark:border-gray-800 p-4">
                        <ReceiptGrid items={items} />
                      </div>
                    )}
                  </div>
                );
              })}

              {customCategories.map((cat) => {
                const items = byCategory[cat.name] || [];
                const isOpen = openCustomFolder === cat.id;

                return (
                  <div key={cat.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-indigo-300 dark:border-indigo-700 overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                      onClick={() => setOpenCustomFolder(isOpen ? null : cat.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Tag className="w-4 h-4 text-indigo-600" />
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{cat.name}</span>
                        <span className="text-xs text-gray-500">Custom · {items.length} receipt{items.length !== 1 ? 's' : ''}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </button>
                    {isOpen && items.length > 0 && (
                      <div className="border-t border-gray-100 dark:border-gray-800 p-4">
                        <ReceiptGrid items={items} />
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 text-gray-500">
      <FolderOpen className="w-10 h-10 mx-auto mb-3 text-gray-300" />
      <p>No receipts yet.</p>
      <Link href="/library" className="text-indigo-600 text-sm hover:underline mt-1 inline-block">
        Go to library
      </Link>
    </div>
  );
}
