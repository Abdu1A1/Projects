"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { CompareDuplicatesDialog } from "@/components/detail/compare-duplicates-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FLAG_META } from "@/lib/constants";
import type { LineItem, Receipt, ReceiptFlag } from "@/lib/types";
import { formatConfidence } from "@/lib/utils";

type EditableReceipt = Receipt & {
  line_items: LineItem[];
  tags: Array<{ id: string; receipt_id: string; label: string }>;
};

async function patchReceipt(receiptId: string, payload: Record<string, unknown>) {
  const response = await fetch(`/api/receipts/${receiptId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Unable to save receipt changes.");
  }
}

export function ReceiptDetailEditor({
  initialReceipt,
  duplicateReceipt,
  categoryOptions,
}: {
  initialReceipt: Receipt;
  duplicateReceipt: Partial<Receipt> | null;
  categoryOptions: string[];
}) {
  const router = useRouter();
  const [receipt, setReceipt] = useState<EditableReceipt>({
    ...initialReceipt,
    line_items: initialReceipt.line_items ?? [],
    tags: initialReceipt.tags ?? [],
  });
  const [tagDraft, setTagDraft] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);

  const lowConfidence = (receipt.confidence ?? 0) < 0.7;
  const flags = useMemo(() => receipt.flags ?? [], [receipt.flags]);

  const saveField = async (field: string, value: unknown) => {
    setSavingField(field);
    try {
      await patchReceipt(receipt.id, { fields: { [field]: value } });
      toast.success("Saved");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save.");
    } finally {
      setSavingField(null);
    }
  };

  const saveLineItems = async (lineItems: LineItem[]) => {
    setSavingField("line_items");
    try {
      await patchReceipt(receipt.id, { line_items: lineItems });
      toast.success("Line items updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save line items.");
    } finally {
      setSavingField(null);
    }
  };

  const saveTags = async (tags: Array<{ id: string; receipt_id: string; label: string }>) => {
    setSavingField("tags");
    try {
      await patchReceipt(receipt.id, { tags });
      toast.success("Tags updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save tags.");
    } finally {
      setSavingField(null);
    }
  };

  const deleteReceipt = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/receipts/${receipt.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete receipt.");
      }
      toast.success("Receipt deleted");
      router.push("/library");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete receipt.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="relative aspect-[4/5] bg-secondary">
            {receipt.image_url ? (
              <Image src={receipt.image_url} alt={receipt.merchant ?? "Receipt image"} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image uploaded</div>
            )}
          </div>
        </Card>

        {lowConfidence ? (
          <Card className="border-yellow-300 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/40">
            <CardContent className="p-5 text-sm text-yellow-800 dark:text-yellow-200">
              AI wasn&apos;t confident — please review this receipt.
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
            <CardDescription>AI summary and review metadata.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={receipt.summary ?? ""}
              onChange={(event) => setReceipt((current) => ({ ...current, summary: event.target.value }))}
              onBlur={(event) => void saveField("summary", event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Confidence {formatConfidence(receipt.confidence)}</Badge>
              {flags.map((flag) => {
                const meta = FLAG_META[flag as ReceiptFlag];
                return (
                  <Badge key={flag} className={meta?.className}>
                    {meta?.label ?? flag}
                  </Badge>
                );
              })}
              {flags.includes("possible_duplicate") ? (
                <CompareDuplicatesDialog currentReceipt={receipt} duplicateReceipt={duplicateReceipt} />
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Receipt details</CardTitle>
            <CardDescription>Fields save on blur with optimistic local updates.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium">Merchant</label>
              <Input
                value={receipt.merchant ?? ""}
                onChange={(event) => setReceipt((current) => ({ ...current, merchant: event.target.value }))}
                onBlur={(event) => void saveField("merchant", event.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Date</label>
              <Input
                type="date"
                value={receipt.date ?? ""}
                onChange={(event) => setReceipt((current) => ({ ...current, date: event.target.value }))}
                onBlur={(event) => void saveField("date", event.target.value || null)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Time</label>
              <Input
                type="time"
                value={receipt.time ?? ""}
                onChange={(event) => setReceipt((current) => ({ ...current, time: event.target.value }))}
                onBlur={(event) => void saveField("time", event.target.value || null)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Total</label>
              <Input
                type="number"
                step="0.01"
                value={receipt.total ?? ""}
                onChange={(event) =>
                  setReceipt((current) => ({
                    ...current,
                    total: event.target.value ? Number.parseFloat(event.target.value) : null,
                  }))
                }
                onBlur={(event) => void saveField("total", event.target.value ? Number.parseFloat(event.target.value) : null)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Tax</label>
              <Input
                type="number"
                step="0.01"
                value={receipt.tax ?? ""}
                onChange={(event) =>
                  setReceipt((current) => ({
                    ...current,
                    tax: event.target.value ? Number.parseFloat(event.target.value) : null,
                  }))
                }
                onBlur={(event) => void saveField("tax", event.target.value ? Number.parseFloat(event.target.value) : null)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Currency</label>
              <Input
                value={receipt.currency ?? ""}
                onChange={(event) => setReceipt((current) => ({ ...current, currency: event.target.value }))}
                onBlur={(event) => void saveField("currency", event.target.value || null)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Payment method</label>
              <Input
                value={receipt.payment_method ?? ""}
                onChange={(event) => setReceipt((current) => ({ ...current, payment_method: event.target.value }))}
                onBlur={(event) => void saveField("payment_method", event.target.value || null)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium">Category</label>
              <select
                className="flex h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm"
                value={receipt.category ?? "Other"}
                onChange={(event) => {
                  const value = event.target.value;
                  setReceipt((current) => ({ ...current, category: value }));
                  void saveField("category", value);
                }}
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line items</CardTitle>
            <CardDescription>Edit rows inline. Changes are saved on blur and can also be saved manually.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="overflow-x-auto rounded-3xl border border-border">
              <table className="min-w-full text-sm">
                <thead className="bg-secondary/70 text-left">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.line_items.map((item, index) => (
                    <tr key={item.id || index} className="border-t border-border">
                      <td className="px-4 py-3">
                        <Input
                          value={item.name}
                          onChange={(event) => {
                            const next = [...receipt.line_items];
                            next[index] = { ...next[index], name: event.target.value };
                            setReceipt((current) => ({ ...current, line_items: next }));
                          }}
                          onBlur={() => void saveLineItems(receipt.line_items)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.qty ?? ""}
                          onChange={(event) => {
                            const next = [...receipt.line_items];
                            next[index] = {
                              ...next[index],
                              qty: event.target.value ? Number.parseFloat(event.target.value) : null,
                            };
                            setReceipt((current) => ({ ...current, line_items: next }));
                          }}
                          onBlur={() => void saveLineItems(receipt.line_items)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.price ?? ""}
                          onChange={(event) => {
                            const next = [...receipt.line_items];
                            next[index] = {
                              ...next[index],
                              price: event.target.value ? Number.parseFloat(event.target.value) : null,
                            };
                            setReceipt((current) => ({ ...current, line_items: next }));
                          }}
                          onBlur={() => void saveLineItems(receipt.line_items)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setReceipt((current) => ({
                    ...current,
                    line_items: [
                      ...current.line_items,
                      {
                        id: crypto.randomUUID(),
                        receipt_id: current.id,
                        name: "",
                        qty: 1,
                        price: 0,
                      },
                    ],
                  }))
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add line item
              </Button>
              <Button type="button" onClick={() => void saveLineItems(receipt.line_items)}>
                Save line items
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>Add or remove tags to improve future search results.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {receipt.tags.map((tag) => (
                <Badge key={tag.id} variant="outline" className="gap-2">
                  <span>{tag.label}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = receipt.tags.filter((entry) => entry.id !== tag.id);
                      setReceipt((current) => ({ ...current, tags: next }));
                      void saveTags(next);
                    }}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-3">
              <Input value={tagDraft} onChange={(event) => setTagDraft(event.target.value)} placeholder="Add a tag" />
              <Button
                type="button"
                onClick={() => {
                  if (!tagDraft.trim()) {
                    return;
                  }
                  const next = [
                    ...receipt.tags,
                    { id: crypto.randomUUID(), receipt_id: receipt.id, label: tagDraft.trim() },
                  ];
                  setReceipt((current) => ({ ...current, tags: next }));
                  setTagDraft("");
                  void saveTags(next);
                }}
              >
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Delete this receipt and all related line items and tags.</p>
            <Button variant="destructive" type="button" onClick={() => void deleteReceipt()} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete receipt
            </Button>
          </CardContent>
        </Card>

        {savingField ? <p className="text-sm text-muted-foreground">Saving {savingField}...</p> : null}
      </div>
    </div>
  );
}
