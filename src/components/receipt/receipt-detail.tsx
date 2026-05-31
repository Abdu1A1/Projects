'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Copy,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Flag, Receipt } from '@/lib/types';
import { CATEGORIES, CATEGORY_COLORS, FLAG_META } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';

export function ReceiptDetail({
  receipt: initial,
  duplicate,
}: {
  receipt: Receipt;
  duplicate: Receipt | null;
}) {
  const router = useRouter();
  const [receipt, setReceipt] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [newTag, setNewTag] = useState('');

  const flags = (receipt.flags ?? []) as Flag[];
  const lowConfidence = (receipt.confidence ?? 0) < 0.7;

  async function patchField(field: string, value: any) {
    setSaving(true);
    const prev = (receipt as any)[field];
    setReceipt((r) => ({ ...r, [field]: value }));
    try {
      const res = await fetch(`/api/receipts/${receipt.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error('Save failed');
      router.refresh();
    } catch (err: any) {
      setReceipt((r) => ({ ...r, [field]: prev }));
      toast.error(err?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function patchCategory(value: string) {
    const prev = receipt.category;
    setReceipt((r) => ({ ...r, category: value }));
    try {
      const res = await fetch(`/api/receipts/${receipt.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          category: value,
          _correction: { merchant: receipt.merchant, original_category: prev },
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success(`Category updated to ${value}`);
      router.refresh();
    } catch (err: any) {
      setReceipt((r) => ({ ...r, category: prev }));
      toast.error(err?.message ?? 'Save failed');
    }
  }

  async function deleteReceipt() {
    if (!confirm('Delete this receipt? This cannot be undone.')) return;
    const res = await fetch(`/api/receipts/${receipt.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Receipt deleted');
      router.push('/library');
    } else {
      toast.error('Delete failed');
    }
  }

  async function addTag() {
    const label = newTag.trim();
    if (!label) return;
    const res = await fetch(`/api/receipts/${receipt.id}/tags`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ label }),
    });
    if (res.ok) {
      const data = await res.json();
      setReceipt((r) => ({ ...r, tags: [...(r.tags ?? []), data.tag] }));
      setNewTag('');
    }
  }

  async function removeTag(id: string) {
    setReceipt((r) => ({ ...r, tags: (r.tags ?? []).filter((t) => t.id !== id) }));
    await fetch(`/api/receipts/${receipt.id}/tags?id=${id}`, { method: 'DELETE' });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/library">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {duplicate && (
            <Button variant="outline" onClick={() => setCompareOpen(true)} className="gap-2">
              <Copy className="h-4 w-4" /> Compare duplicate
            </Button>
          )}
          <Button variant="destructive" onClick={deleteReceipt} className="gap-2">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {lowConfidence && (
        <div className="rounded-md border border-yellow-500/40 bg-yellow-50 dark:bg-yellow-900/20 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <p className="font-medium">AI wasn&apos;t confident — please review this receipt</p>
            <p className="text-sm text-muted-foreground mt-1">
              Confidence:{' '}
              <span className="font-medium">
                {Math.round((receipt.confidence ?? 0) * 100)}%
              </span>
              . Double-check the merchant, date, and total below.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border bg-muted aspect-[3/4]">
            {receipt.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={receipt.image_url}
                alt="Receipt"
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-muted-foreground">
                No image
              </div>
            )}
          </div>
          {flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {flags.map((f) => {
                const meta = FLAG_META[f];
                if (!meta) return null;
                return (
                  <span
                    key={f}
                    title={meta.description}
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${meta.color}`}
                  >
                    {meta.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {receipt.summary && (
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">AI summary</h3>
              <p className="text-sm">{receipt.summary}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <EditableField
              label="Merchant"
              value={receipt.merchant ?? ''}
              onSave={(v) => patchField('merchant', v || null)}
            />
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <Select value={receipt.category ?? 'Other'} onValueChange={patchCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <EditableField
              label="Date"
              type="date"
              value={receipt.date ?? ''}
              onSave={(v) => patchField('date', v || null)}
            />
            <EditableField
              label="Time"
              value={receipt.time ?? ''}
              onSave={(v) => patchField('time', v || null)}
            />
            <EditableField
              label="Total"
              type="number"
              value={receipt.total === null ? '' : String(receipt.total)}
              onSave={(v) => patchField('total', v ? Number(v) : null)}
            />
            <EditableField
              label="Tax"
              type="number"
              value={receipt.tax === null ? '' : String(receipt.tax)}
              onSave={(v) => patchField('tax', v ? Number(v) : null)}
            />
            <EditableField
              label="Currency"
              value={receipt.currency ?? 'CAD'}
              onSave={(v) => patchField('currency', v || 'CAD')}
            />
            <EditableField
              label="Payment method"
              value={receipt.payment_method ?? ''}
              onSave={(v) => patchField('payment_method', v || null)}
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Line items</h3>
            {receipt.line_items && receipt.line_items.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium">Item</th>
                      <th className="text-right p-2 font-medium w-16">Qty</th>
                      <th className="text-right p-2 font-medium w-24">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.line_items.map((li, i) => (
                      <tr key={li.id ?? i} className="border-t">
                        <td className="p-2">{li.name}</td>
                        <td className="p-2 text-right tabular-nums">{li.qty}</td>
                        <td className="p-2 text-right tabular-nums">
                          {formatCurrency(li.price, receipt.currency ?? 'CAD')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No line items extracted.</p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Tags</h3>
            <div className="flex flex-wrap items-center gap-2">
              {(receipt.tags ?? []).map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs"
                >
                  {t.label}
                  <button
                    onClick={() => removeTag(t.id!)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Remove tag"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tag"
                  className="h-8 w-32"
                />
                <Button size="sm" variant="ghost" onClick={addTag} aria-label="Add tag">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Possible duplicate</DialogTitle>
          </DialogHeader>
          {duplicate && (
            <div className="grid gap-4 md:grid-cols-2">
              <DuplicateCard label="This receipt" r={receipt} />
              <DuplicateCard label="Existing receipt" r={duplicate} link />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditableField({
  label,
  value,
  type = 'text',
  onSave,
}: {
  label: string;
  value: string;
  type?: string;
  onSave: (value: string) => void;
}) {
  const [val, setVal] = useState(value);
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Input
        type={type}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          if (val !== value) onSave(val);
        }}
      />
    </div>
  );
}

function DuplicateCard({ label, r, link }: { label: string; r: Receipt; link?: boolean }) {
  const cat = r.category ?? 'Other';
  const inner = (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold">{r.merchant ?? 'Unknown'}</div>
      <div className="text-sm text-muted-foreground">{formatDate(r.date)}</div>
      <div className="text-xl font-bold tabular-nums">
        {formatCurrency(r.total, r.currency ?? 'CAD')}
      </div>
      <Badge className={`${CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other} border-transparent`}>
        {cat}
      </Badge>
    </div>
  );
  if (link) return <Link href={`/library/${r.id}`}>{inner}</Link>;
  return inner;
}
