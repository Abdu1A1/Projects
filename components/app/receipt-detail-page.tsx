"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CopyCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FLAG_META } from "@/lib/constants";
import { formatCurrency, formatReceiptDate } from "@/lib/format";
import type { Category, Receipt } from "@/lib/types";

export function ReceiptDetailPage({ receipt, categories, duplicate }: { receipt: Receipt; categories: Category[]; duplicate: Receipt | null }) {
  const router = useRouter();
  const [draft, setDraft] = useState(receipt);
  const [saving, setSaving] = useState(false);

  const tagsText = useMemo(() => draft.tags.map((tag) => tag.label).join(", "), [draft.tags]);

  const patchReceipt = async (patch: Record<string, unknown>) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/receipts/${receipt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Update failed.");
      }
      const payload = await response.json();
      setDraft(payload.receipt);
      toast.success("Receipt saved.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const removeReceipt = async () => {
    if (!window.confirm("Delete this receipt?")) return;
    const response = await fetch(`/api/receipts/${receipt.id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error("Delete failed.");
      return;
    }
    toast.success("Receipt deleted.");
    router.push("/library");
    router.refresh();
  };

  const compareButton = duplicate ? (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <CopyCheck className="h-4 w-4" />
          Compare
        </Button>
      </DialogTrigger>
      <DialogContent>
        <div className="grid gap-4 md:grid-cols-2">
          {[draft, duplicate].map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle>{item.merchant || "Unknown merchant"}</CardTitle>
                <CardDescription>
                  {formatReceiptDate(item.date)} · {formatCurrency(item.total, item.currency)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt={item.merchant || "Receipt"} className="h-80 w-full rounded-2xl object-cover" src={item.image_url} />
                ) : null}
                <p className="text-sm text-muted-foreground">{item.summary}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  ) : null;

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {draft.confidence < 0.7 ? (
        <div className="flex flex-col items-start justify-between gap-4 rounded-[1.5rem] border border-yellow-500/40 bg-yellow-500/10 p-4 text-yellow-900 dark:text-yellow-100 md:flex-row md:items-center">
          <div>
            <p className="font-medium">AI wasn&apos;t confident — please review this receipt</p>
            <p className="text-sm opacity-80">Confidence score: {(draft.confidence * 100).toFixed(0)}%</p>
          </div>
          {compareButton}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Original receipt</CardTitle>
            <CardDescription>{formatReceiptDate(draft.date)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-hidden rounded-[1.5rem] bg-muted">
              {draft.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={draft.merchant || "Receipt image"} className="h-full w-full object-cover" src={draft.image_url} />
              ) : (
                <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">No image available</div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {draft.flags.map((flag) => (
                <Badge className={FLAG_META[flag].className} key={flag}>
                  {FLAG_META[flag].label}
                </Badge>
              ))}
              {draft.flags.includes("possible_duplicate") ? compareButton : null}
            </div>
            <div className="rounded-[1.5rem] bg-secondary/60 p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <AlertTriangle className="h-4 w-4 text-primary" />
                AI summary
              </div>
              <p className="mt-2 leading-6">{draft.summary}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Receipt fields</CardTitle>
              <CardDescription>Inline edits save on blur and update the card optimistically.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Merchant</label>
                <Input
                  value={draft.merchant || ""}
                  onBlur={(event) => void patchReceipt({ merchant: event.target.value || null })}
                  onChange={(event) => setDraft((current) => ({ ...current, merchant: event.target.value || null }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={draft.date || ""}
                  onBlur={(event) => void patchReceipt({ date: event.target.value || null })}
                  onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value || null }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time</label>
                <Input
                  type="time"
                  value={draft.time || ""}
                  onBlur={(event) => void patchReceipt({ time: event.target.value || null })}
                  onChange={(event) => setDraft((current) => ({ ...current, time: event.target.value || null }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Total</label>
                <Input
                  type="number"
                  value={draft.total ?? ""}
                  onBlur={(event) => void patchReceipt({ total: event.target.value ? Number(event.target.value) : null })}
                  onChange={(event) => setDraft((current) => ({ ...current, total: event.target.value ? Number(event.target.value) : null }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tax</label>
                <Input
                  type="number"
                  value={draft.tax ?? ""}
                  onBlur={(event) => void patchReceipt({ tax: event.target.value ? Number(event.target.value) : null })}
                  onChange={(event) => setDraft((current) => ({ ...current, tax: event.target.value ? Number(event.target.value) : null }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment method</label>
                <Input
                  value={draft.payment_method || ""}
                  onBlur={(event) => void patchReceipt({ payment_method: event.target.value || null })}
                  onChange={(event) => setDraft((current) => ({ ...current, payment_method: event.target.value || null }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={draft.category || "Other"}
                  onChange={(event) => {
                    const nextCategory = event.target.value;
                    setDraft((current) => ({ ...current, category: nextCategory }));
                    void patchReceipt({ category: nextCategory, originalCategory: receipt.category });
                  }}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Tags</label>
                <Input
                  value={tagsText}
                  onBlur={(event) =>
                    void patchReceipt({
                      tags: event.target.value
                        .split(",")
                        .map((value) => value.trim())
                        .filter(Boolean),
                    })
                  }
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      tags: event.target.value
                        .split(",")
                        .map((value) => value.trim())
                        .filter(Boolean)
                        .map((label, index) => ({ id: `${index}-${label}`, label })),
                    }))
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Summary</label>
                <Textarea
                  value={draft.summary || ""}
                  onBlur={(event) => void patchReceipt({ summary: event.target.value || null })}
                  onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value || null }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Line items</CardTitle>
              <CardDescription>Every line item stays editable and saves as a full row set on blur.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {draft.line_items.map((item, index) => (
                <div className="grid gap-3 rounded-[1.5rem] border border-border/60 p-3 sm:grid-cols-[1fr_120px_120px]" key={item.id || index}>
                  <Input
                    value={item.name}
                    onBlur={() => void patchReceipt({ line_items: draft.line_items })}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        line_items: current.line_items.map((lineItem, itemIndex) =>
                          itemIndex === index ? { ...lineItem, name: event.target.value } : lineItem,
                        ),
                      }))
                    }
                  />
                  <Input
                    type="number"
                    value={item.qty ?? ""}
                    onBlur={() => void patchReceipt({ line_items: draft.line_items })}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        line_items: current.line_items.map((lineItem, itemIndex) =>
                          itemIndex === index ? { ...lineItem, qty: event.target.value ? Number(event.target.value) : null } : lineItem,
                        ),
                      }))
                    }
                  />
                  <Input
                    type="number"
                    value={item.price ?? ""}
                    onBlur={() => void patchReceipt({ line_items: draft.line_items })}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        line_items: current.line_items.map((lineItem, itemIndex) =>
                          itemIndex === index ? { ...lineItem, price: event.target.value ? Number(event.target.value) : null } : lineItem,
                        ),
                      }))
                    }
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    line_items: [...current.line_items, { id: crypto.randomUUID(), name: "", qty: 1, price: null }],
                  }))
                }
              >
                Add item
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-border/60 bg-card p-4">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Confidence score</p>
              <p>{(draft.confidence * 100).toFixed(0)}% confidence on this extraction.</p>
            </div>
            <Button onClick={removeReceipt} type="button" variant="destructive">
              <Trash2 className="h-4 w-4" />
              Delete receipt
            </Button>
          </div>

          {saving ? <p className="text-sm text-muted-foreground">Saving…</p> : null}
        </div>
      </div>
    </div>
  );
}
