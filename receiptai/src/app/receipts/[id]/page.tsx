'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ReceiptWithDetails, CATEGORIES, FlagType, CATEGORY_COLORS } from '@/types';
import { FlagBadge } from '@/components/receipts/FlagBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertTriangle,
  ArrowLeft,
  Trash2,
  ExternalLink,
  ImageIcon,
  Plus,
  X,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface InlineFieldProps {
  label: string;
  value: string;
  onSave: (value: string) => Promise<void>;
  type?: string;
  placeholder?: string;
}

function InlineField({ label, value, onSave, type = 'text', placeholder }: InlineFieldProps) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleBlur = async () => {
    if (localValue !== value) {
      setSaving(true);
      await onSave(localValue);
      setSaving(false);
    }
    setEditing(false);
  };

  return (
    <div>
      <Label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</Label>
      {editing ? (
        <div className="flex items-center gap-2 mt-1">
          <Input
            type={type}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            autoFocus
            className="h-8 text-sm"
          />
          {saving && <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0" />}
        </div>
      ) : (
        <p
          className="mt-1 text-gray-900 dark:text-white cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 -mx-2 rounded-lg transition-colors text-sm group flex items-center gap-2"
          onClick={() => { setEditing(true); setLocalValue(value); }}
        >
          {value || <span className="text-gray-400 italic">{placeholder || 'Click to edit'}</span>}
          <span className="opacity-0 group-hover:opacity-100 text-xs text-gray-400">(edit)</span>
        </p>
      )}
    </div>
  );
}

export default function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [receipt, setReceipt] = useState<ReceiptWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  useEffect(() => {
    fetch(`/api/receipts/${id}`)
      .then((r) => r.json())
      .then((d) => setReceipt(d.receipt))
      .catch(() => toast.error('Failed to load receipt'))
      .finally(() => setLoading(false));
  }, [id]);

  const updateField = async (field: string, value: string | number | null) => {
    if (!receipt) return;
    const optimistic = { ...receipt, [field]: value };
    setReceipt(optimistic as ReceiptWithDetails);

    try {
      const response = await fetch(`/api/receipts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) throw new Error('Update failed');
    } catch {
      toast.error('Failed to save changes');
      setReceipt(receipt);
    }
  };

  const updateCategory = async (category: string) => {
    if (!receipt) return;
    const originalCategory = receipt.category;
    setSavingCategory(true);
    setReceipt({ ...receipt, category });

    try {
      const response = await fetch(`/api/receipts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, original_category: originalCategory }),
      });
      if (!response.ok) throw new Error('Update failed');
      toast.success('Category updated');
    } catch {
      toast.error('Failed to update category');
      setReceipt(receipt);
    } finally {
      setSavingCategory(false);
    }
  };


  const addTag = async () => {
    if (!receipt || !newTag.trim()) return;
    const tags = [...receipt.tags.map((t) => t.label), newTag.trim()];
    setReceipt({
      ...receipt,
      tags: tags.map((label, i) => ({ id: `temp-${i}`, receipt_id: id, label })),
    });
    setNewTag('');

    try {
      await fetch(`/api/receipts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      });
    } catch {
      toast.error('Failed to add tag');
    }
  };

  const removeTag = async (label: string) => {
    if (!receipt) return;
    const tags = receipt.tags.filter((t) => t.label !== label).map((t) => t.label);
    setReceipt({
      ...receipt,
      tags: tags.map((lbl, i) => ({ id: `temp-${i}`, receipt_id: id, label: lbl })),
    });

    try {
      await fetch(`/api/receipts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      });
    } catch {
      toast.error('Failed to remove tag');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this receipt? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await fetch(`/api/receipts/${id}`, { method: 'DELETE' });
      router.push('/library');
      toast.success('Receipt deleted');
    } catch {
      toast.error('Failed to delete receipt');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center py-24">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Receipt not found</h2>
        <Button onClick={() => router.push('/library')} variant="outline" className="gap-2 mt-4">
          <ArrowLeft className="w-4 h-4" />
          Back to library
        </Button>
      </div>
    );
  }

  const flags = (receipt.flags || []) as FlagType[];
  const showConfidenceBanner = receipt.confidence != null && receipt.confidence < 0.7;
  const categoryColor = receipt.category ? CATEGORY_COLORS[receipt.category] : '#94a3b8';

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={() => router.push('/library')} variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Library
        </Button>
        <Button
          onClick={handleDelete}
          variant="ghost"
          size="sm"
          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          disabled={deleting}
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Delete
        </Button>
      </div>

      {/* Low confidence banner */}
      {showConfidenceBanner && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            AI wasn&apos;t confident in this extraction ({Math.round((receipt.confidence || 0) * 100)}% confidence) — please review and edit the fields below.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receipt Image */}
        <div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden aspect-[3/4] relative">
            {receipt.image_url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={receipt.image_url}
                  alt="Receipt"
                  className="w-full h-full object-contain"
                />
                <a
                  href={receipt.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 right-3 bg-white dark:bg-gray-900 rounded-lg p-1.5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <ExternalLink className="w-4 h-4 text-gray-600" />
                </a>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
              </div>
            )}
          </div>

          {/* AI Summary */}
          {receipt.summary && (
            <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-300 uppercase tracking-wide mb-1">
                AI Summary
              </p>
              <p className="text-sm text-indigo-900 dark:text-indigo-100">{receipt.summary}</p>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          {/* Merchant & Total */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <InlineField
                label="Merchant"
                value={receipt.merchant || ''}
                onSave={(v) => updateField('merchant', v)}
                placeholder="Unknown merchant"
              />
              {receipt.category && (
                <div
                  className="text-white text-xs font-semibold px-3 py-1 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: categoryColor }}
                >
                  {receipt.category}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <InlineField
                label="Total"
                value={receipt.total?.toString() || ''}
                onSave={(v) => updateField('total', v ? parseFloat(v) : null)}
                type="number"
                placeholder="0.00"
              />
              <InlineField
                label="Tax"
                value={receipt.tax?.toString() || ''}
                onSave={(v) => updateField('tax', v ? parseFloat(v) : null)}
                type="number"
                placeholder="0.00"
              />
              <InlineField
                label="Date"
                value={receipt.date || ''}
                onSave={(v) => updateField('date', v)}
                type="date"
              />
              <InlineField
                label="Time"
                value={receipt.time || ''}
                onSave={(v) => updateField('time', v)}
                placeholder="HH:MM"
              />
              <InlineField
                label="Currency"
                value={receipt.currency || 'CAD'}
                onSave={(v) => updateField('currency', v)}
              />
              <InlineField
                label="Payment Method"
                value={receipt.payment_method || ''}
                onSave={(v) => updateField('payment_method', v)}
                placeholder="e.g. Visa"
              />
            </div>
          </div>

          {/* Category */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <Label className="text-xs text-gray-500 uppercase tracking-wide">Category</Label>
            <div className="flex items-center gap-2 mt-2">
              <Select value={receipt.category || ''} onValueChange={(v) => v && updateCategory(v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {savingCategory && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
              {!savingCategory && receipt.category && <CheckCircle className="w-4 h-4 text-green-500" />}
            </div>
          </div>

          {/* Flags */}
          {flags.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Flags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {flags.map((flag) => (
                  <FlagBadge key={flag} flag={flag} size="md" />
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <Label className="text-xs text-gray-500 uppercase tracking-wide">Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {receipt.tags.map((tag) => (
                <Badge key={tag.id} variant="outline" className="gap-1 text-sm">
                  {tag.label}
                  <button onClick={() => removeTag(tag.label)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
              />
              <Button size="sm" variant="outline" onClick={addTag} className="h-8 px-3">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Confidence */}
          {receipt.confidence != null && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div
                className={`w-2 h-2 rounded-full ${
                  receipt.confidence >= 0.8 ? 'bg-green-500' :
                  receipt.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
              />
              AI Confidence: {Math.round(receipt.confidence * 100)}%
            </div>
          )}

          {/* Created date */}
          <p className="text-xs text-gray-400">
            Added {format(new Date(receipt.created_at), 'PPP')}
          </p>
        </div>
      </div>

      {/* Line Items */}
      {receipt.line_items.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Line Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left py-2 pr-4">Item</th>
                  <th className="text-right py-2 pr-4">Qty</th>
                  <th className="text-right py-2">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {receipt.line_items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 pr-4 text-gray-900 dark:text-white">{item.name}</td>
                    <td className="py-2.5 pr-4 text-right text-gray-600 dark:text-gray-400">{item.qty}</td>
                    <td className="py-2.5 text-right text-gray-900 dark:text-white font-medium">
                      ${item.price?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 dark:border-gray-700">
                  <td colSpan={2} className="pt-3 text-right text-sm font-semibold text-gray-900 dark:text-white pr-4">
                    Total
                  </td>
                  <td className="pt-3 text-right font-bold text-gray-900 dark:text-white">
                    ${receipt.total?.toFixed(2) || '—'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
