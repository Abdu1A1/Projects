"use client";

import { useMemo, useState, type ReactNode } from "react";

import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FLAG_STYLES } from "@/lib/constants";
import { currency } from "@/lib/utils";
import { RECEIPT_CATEGORIES, type ReceiptRecord } from "@/types/receipt";

export function ReceiptDetailEditor({ initialReceipt }: { initialReceipt: ReceiptRecord }) {
  const [receipt, setReceipt] = useState(initialReceipt);
  const [saving, setSaving] = useState(false);
  const [duplicate, setDuplicate] = useState<ReceiptRecord | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [newTag, setNewTag] = useState("");

  const lowConfidence = (receipt.confidence ?? 0) < 0.7;

  const savePatch = async (patch: Partial<ReceiptRecord>) => {
    const optimistic = { ...receipt, ...patch };
    setReceipt(optimistic);
    setSaving(true);

    const response = await fetch(`/api/receipts/${receipt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      setReceipt(receipt);
    } else {
      const body = (await response.json()) as { receipt: ReceiptRecord };
      setReceipt(body.receipt);
    }

    setSaving(false);
  };

  const loadDuplicate = async () => {
    const response = await fetch(`/api/receipts/${receipt.id}/duplicate`);
    if (!response.ok) return;
    const body = (await response.json()) as { duplicate: ReceiptRecord | null };
    setDuplicate(body.duplicate);
    setCompareOpen(true);
  };

  const flags = useMemo(() => receipt.flags ?? [], [receipt.flags]);

  const addTag = async () => {
    const tag = newTag.trim();
    if (!tag) return;
    await savePatch({ tags: [...(receipt.tags ?? []), { id: crypto.randomUUID(), label: tag }] });
    setNewTag("");
  };

  const removeTag = async (id: string) => {
    await savePatch({ tags: (receipt.tags ?? []).filter((tag) => tag.id !== id) });
  };

  const deleteReceipt = async () => {
    const confirmed = window.confirm("Delete this receipt?");
    if (!confirmed) return;

    const response = await fetch(`/api/receipts/${receipt.id}`, { method: "DELETE" });
    if (response.ok) {
      window.location.href = "/library";
    }
  };

  return (
    <div className="space-y-4">
      {lowConfidence ? (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 dark:border-yellow-700 dark:bg-yellow-900/25 dark:text-yellow-200">
          AI wasn&apos;t confident — please review this receipt.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardContent className="p-3">
            {receipt.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={receipt.image_url} alt={receipt.merchant ?? "Receipt"} className="w-full rounded-lg object-cover" />
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span>Receipt details</span>
              {saving ? <span className="text-sm font-normal text-zinc-500">Saving…</span> : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Merchant">
              <Input
                value={receipt.merchant ?? ""}
                onChange={(event) => setReceipt((current) => ({ ...current, merchant: event.target.value }))}
                onBlur={(event) => void savePatch({ merchant: event.target.value })}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date">
                <Input
                  type="date"
                  value={receipt.date ?? ""}
                  onChange={(event) => setReceipt((current) => ({ ...current, date: event.target.value }))}
                  onBlur={(event) => void savePatch({ date: event.target.value })}
                />
              </Field>
              <Field label="Time">
                <Input
                  type="time"
                  value={receipt.time ?? ""}
                  onChange={(event) => setReceipt((current) => ({ ...current, time: event.target.value }))}
                  onBlur={(event) => void savePatch({ time: event.target.value })}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Total">
                <Input
                  type="number"
                  value={receipt.total ?? ""}
                  onChange={(event) => setReceipt((current) => ({ ...current, total: Number(event.target.value) }))}
                  onBlur={(event) => void savePatch({ total: Number(event.target.value) })}
                />
              </Field>
              <Field label="Tax">
                <Input
                  type="number"
                  value={receipt.tax ?? ""}
                  onChange={(event) => setReceipt((current) => ({ ...current, tax: Number(event.target.value) }))}
                  onBlur={(event) => void savePatch({ tax: Number(event.target.value) })}
                />
              </Field>
            </div>

            <Field label="Category">
              <Select
                value={receipt.category ?? "Other"}
                options={RECEIPT_CATEGORIES.map((category) => ({ label: category, value: category }))}
                onChange={(event) => void savePatch({ category: event.target.value })}
              />
            </Field>

            <Field label="Payment method">
              <Input
                value={receipt.payment_method ?? ""}
                onChange={(event) => setReceipt((current) => ({ ...current, payment_method: event.target.value }))}
                onBlur={(event) => void savePatch({ payment_method: event.target.value })}
              />
            </Field>

            <Field label="Summary">
              <Textarea
                value={receipt.summary ?? ""}
                onChange={(event) => setReceipt((current) => ({ ...current, summary: event.target.value }))}
                onBlur={(event) => void savePatch({ summary: event.target.value })}
              />
            </Field>

            <Field label="Tags">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {(receipt.tags ?? []).map((tag) => (
                    <button key={tag.id} onClick={() => void removeTag(tag.id)} className="rounded-full bg-zinc-200 px-3 py-1 text-xs dark:bg-zinc-700">
                      {tag.label} ×
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newTag} placeholder="Add tag" onChange={(event) => setNewTag(event.target.value)} />
                  <Button variant="outline" onClick={addTag}>
                    Add
                  </Button>
                </div>
              </div>
            </Field>

            <Field label="Line items">
              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-100 dark:bg-zinc-800">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Qty</th>
                      <th className="px-3 py-2 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(receipt.line_items ?? []).map((item, index) => (
                      <tr key={`${item.name}-${index}`} className="border-t border-zinc-200 dark:border-zinc-700">
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2">{item.qty}</td>
                        <td className="px-3 py-2 text-right">{currency(item.price, receipt.currency ?? "CAD")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Field>

            <Field label="Flags">
              <div className="flex flex-wrap gap-2">
                {flags.map((flag) => {
                  const style = FLAG_STYLES[flag];
                  return (
                    <Badge key={flag} className={style?.className}>
                      {style?.label ?? flag}
                    </Badge>
                  );
                })}
              </div>
            </Field>

            {flags.includes("possible_duplicate") ? (
              <Button variant="outline" onClick={loadDuplicate}>
                Compare
              </Button>
            ) : null}

            <Button variant="destructive" onClick={deleteReceipt}>
              Delete receipt
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={compareOpen} onClose={() => setCompareOpen(false)} title="Possible duplicate comparison">
        {duplicate ? (
          <div className="grid gap-4 md:grid-cols-2">
            <CompareColumn title="Current" receipt={receipt} />
            <CompareColumn title="Possible duplicate" receipt={duplicate} />
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No duplicate receipt found.</p>
        )}
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      {children}
    </div>
  );
}

function CompareColumn({ title, receipt }: { title: string; receipt: ReceiptRecord }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p>Merchant: {receipt.merchant ?? "Unknown"}</p>
        <p>Date: {receipt.date ?? "—"}</p>
        <p>Total: {currency(receipt.total, receipt.currency ?? "CAD")}</p>
        <p>Category: {receipt.category ?? "Other"}</p>
      </CardContent>
    </Card>
  );
}
