'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Folder, FolderOpen, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import type { Receipt } from '@/lib/types';
import { CATEGORIES, CATEGORY_COLORS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';
import { ReceiptCard } from '@/components/receipt/receipt-card';

interface Props {
  receipts: Receipt[];
  view: 'time' | 'merchant';
  folder?: string;
  customCategories: string[];
}

export function FoldersView({ receipts, view, folder, customCategories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const setView = useCallback(
    (v: 'time' | 'merchant') => {
      const p = new URLSearchParams(search.toString());
      p.set('view', v);
      p.delete('folder');
      router.push(`${pathname}?${p.toString()}`);
    },
    [pathname, router, search],
  );

  const setFolder = useCallback(
    (f: string | undefined) => {
      const p = new URLSearchParams(search.toString());
      if (f) p.set('folder', f);
      else p.delete('folder');
      router.push(`${pathname}?${p.toString()}`);
    },
    [pathname, router, search],
  );

  const { folders, drilled } = useMemo(() => {
    if (view === 'time') {
      const map = new Map<string, Receipt[]>();
      receipts.forEach((r) => {
        if (!r.date) return;
        const d = new Date(r.date);
        const key = `${d.getFullYear()} · ${d.toLocaleString('en-CA', { month: 'long' })}`;
        const arr = map.get(key) ?? [];
        arr.push(r);
        map.set(key, arr);
      });
      const folders = Array.from(map.entries()).map(([name, items]) => ({
        name,
        count: items.length,
        total: items.reduce((a, r) => a + (Number(r.total) || 0), 0),
        items,
      }));
      const drilled = folder ? folders.find((f) => f.name === folder)?.items ?? [] : [];
      return { folders, drilled };
    } else {
      const map = new Map<string, Receipt[]>();
      receipts.forEach((r) => {
        const key = r.merchant ?? 'Unknown';
        const arr = map.get(key) ?? [];
        arr.push(r);
        map.set(key, arr);
      });
      const folders = Array.from(map.entries())
        .map(([name, items]) => ({
          name,
          count: items.length,
          total: items.reduce((a, r) => a + (Number(r.total) || 0), 0),
          items,
        }))
        .sort((a, b) => b.total - a.total);
      const drilled = folder ? folders.find((f) => f.name === folder)?.items ?? [] : [];
      return { folders, drilled };
    }
  }, [receipts, view, folder]);

  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  async function createCategory() {
    const name = newName.trim();
    if (!name) return;
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      toast.success(`Created folder "${name}"`);
      setNewName('');
      setShowNew(false);
      router.refresh();
    } else {
      toast.error('Could not create folder');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Tabs value={view} onValueChange={(v) => setView(v as 'time' | 'merchant')}>
          <TabsList>
            <TabsTrigger value="time">By time</TabsTrigger>
            <TabsTrigger value="merchant">By merchant</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" onClick={() => setShowNew((s) => !s)}>
          <Plus className="mr-1 h-4 w-4" /> New custom folder
        </Button>
      </div>

      {showNew && (
        <div className="rounded-lg border bg-card p-4 flex items-center gap-2">
          <Input
            value={newName}
            placeholder="Folder name"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') createCategory();
            }}
          />
          <Button onClick={createCategory}>Create</Button>
        </div>
      )}

      {customCategories.length > 0 && view === 'time' && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Custom folders</h2>
          <div className="flex flex-wrap gap-2">
            {customCategories.map((name) => (
              <Link
                key={name}
                href={`/library?category=${encodeURIComponent(name)}`}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                  CATEGORY_COLORS[name] ?? ''
                }`}
              >
                <Folder className="h-3.5 w-3.5" />
                {name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {folder && drilled.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FolderOpen className="h-5 w-5" /> {folder}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setFolder(undefined)}>
              ← Back to folders
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {drilled.map((r) => (
              <ReceiptCard key={r.id} receipt={r} />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((f) => (
            <button
              key={f.name}
              type="button"
              onClick={() => setFolder(f.name)}
              className="text-left"
            >
              <Card className="transition hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Folder className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{f.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {f.count} {f.count === 1 ? 'receipt' : 'receipts'}
                    </div>
                  </div>
                  <div className="text-right font-semibold tabular-nums">
                    {formatCurrency(f.total, f.items[0]?.currency ?? 'CAD')}
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      {view === 'time' && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Quick links</h3>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c}
                href={`/library?category=${c}`}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${
                  CATEGORY_COLORS[c] ?? ''
                }`}
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
