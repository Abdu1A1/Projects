"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FLAG_META, RECEIPT_CATEGORIES } from "@/lib/constants";
import type { LineItem, Receipt, ReceiptTag } from "@/lib/types";
import { cn, toDateInput } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  receipt: Receipt;
  lineItems: LineItem[];
  tags: ReceiptTag[];
  duplicate: Receipt | null;
};

export function ReceiptEditor({ receipt, lineItems, tags, duplicate }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState({
    merchant: receipt.merchant ?? "",
    date: toDateInput(receipt.date),
    time: receipt.time ?? "",
    total: receipt.total ?? 0,
    tax: receipt.tax ?? 0,
    currency: receipt.currency ?? "CAD",
    payment_method: receipt.payment_method ?? "",
    category: receipt.category ?? "Other",
    summary: receipt.summary ?? "",
    confidence: receipt.confidence ?? 0,
  });
  const [editableTags, setEditableTags] = useState(tags);
  const [newTag, setNewTag] = useState("");
  const [isComparing, setIsComparing] = useState(false);

  const lowConfidence = (receipt.confidence ?? 0) < 0.7;

  const saveField = async (field: string, value: unknown) => {
    await fetch(`/api/receipts/${receipt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    router.refresh();
  };

  const addTag = async () => {
    if (!newTag.trim()) return;

    const response = await fetch(`/api/receipts/${receipt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addTag: newTag.trim() }),
    });

    if (response.ok) {
      setEditableTags((prev) => [
        ...prev,
        { id: crypto.randomUUID(), receipt_id: receipt.id, label: newTag.trim() },
      ]);
      setNewTag("");
      router.refresh();
    }
  };

  const removeTag = async (label: string) => {
    const response = await fetch(`/api/receipts/${receipt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeTag: label }),
    });

    if (response.ok) {
      setEditableTags((prev) => prev.filter((tag) => tag.label !== label));
      router.refresh();
    }
  };

  const deleteReceipt = async () => {
    const response = await fetch(`/api/receipts/${receipt.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      router.push("/library");
      router.refresh();
    }
  };

  const flags = useMemo(() => receipt.flags ?? [], [receipt.flags]);

  return (
    <div className="space-y-6">
      {lowConfidence && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
          AI wasn't confident — please review this receipt.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Original Receipt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border bg-muted">
              <Image
                src={receipt.image_url}
                alt={receipt.merchant || "Receipt image"}
                fill
                className="object-contain"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Extracted Fields</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                value={draft.merchant}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, merchant: event.target.value }))
                }
                onBlur={(event) => saveField("merchant", event.target.value)}
                placeholder="Merchant"
              />
              <Input
                value={draft.date}
                type="date"
                onChange={(event) => setDraft((prev) => ({ ...prev, date: event.target.value }))}
                onBlur={(event) => saveField("date", event.target.value)}
              />
              <Input
                value={draft.time}
                onChange={(event) => setDraft((prev) => ({ ...prev, time: event.target.value }))}
                onBlur={(event) => saveField("time", event.target.value)}
                placeholder="Time"
              />
              <Input
                value={draft.currency}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))
                }
                onBlur={(event) => saveField("currency", event.target.value)}
                placeholder="Currency"
              />
              <Input
                value={draft.total}
                type="number"
                step="0.01"
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, total: Number(event.target.value) }))
                }
                onBlur={(event) => saveField("total", Number(event.target.value))}
                placeholder="Total"
              />
              <Input
                value={draft.tax}
                type="number"
                step="0.01"
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, tax: Number(event.target.value) }))
                }
                onBlur={(event) => saveField("tax", Number(event.target.value))}
                placeholder="Tax"
              />
              <Input
                value={draft.payment_method}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, payment_method: event.target.value }))
                }
                onBlur={(event) => saveField("payment_method", event.target.value)}
                placeholder="Payment method"
              />
              <Select
                value={draft.category}
                onChange={(event) => {
                  const category = event.target.value;
                  setDraft((prev) => ({ ...prev, category }));
                  void saveField("category", category);
                }}
              >
                {RECEIPT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </div>

            <Textarea
              value={draft.summary}
              onChange={(event) => setDraft((prev) => ({ ...prev, summary: event.target.value }))}
              onBlur={(event) => saveField("summary", event.target.value)}
              placeholder="AI Summary"
            />

            <Input
              type="number"
              min={0}
              max={1}
              step="0.01"
              value={draft.confidence}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, confidence: Number(event.target.value) }))
              }
              onBlur={(event) => saveField("confidence", Number(event.target.value))}
            />

            <div className="space-y-2">
              <p className="text-sm font-medium">Tags</p>
              <div className="flex flex-wrap gap-2">
                {editableTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => removeTag(tag.label)}
                    className="rounded-full border px-2 py-1 text-xs hover:bg-muted"
                  >
                    {tag.label} ×
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(event) => setNewTag(event.target.value)}
                  placeholder="Add tag"
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Flags</p>
              <div className="flex flex-wrap gap-2">
                {flags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No flags</p>
                ) : (
                  flags.map((flag) => {
                    const meta = FLAG_META[flag as keyof typeof FLAG_META];
                    return (
                      <Badge
                        key={flag}
                        className={cn(meta?.color ?? "bg-muted text-muted-foreground")}
                      >
                        {meta?.label ?? flag}
                      </Badge>
                    );
                  })
                )}
              </div>
              {flags.includes("possible_duplicate") && duplicate && (
                <Button type="button" variant="outline" onClick={() => setIsComparing(true)}>
                  Compare
                </Button>
              )}
            </div>

            <Button type="button" variant="destructive" onClick={deleteReceipt}>
              Delete Receipt
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Item</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2">Price</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr>
                    <td className="py-4 text-muted-foreground" colSpan={3}>
                      No line items found.
                    </td>
                  </tr>
                ) : (
                  lineItems.map((item) => (
                    <tr className="border-b" key={item.id}>
                      <td className="py-2">{item.name}</td>
                      <td className="py-2">{item.qty ?? "-"}</td>
                      <td className="py-2">{item.price ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {isComparing && duplicate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-xl bg-background p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Potential Duplicate Comparison</h3>
              <Button variant="outline" onClick={() => setIsComparing(false)}>
                Close
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Current</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Merchant: {receipt.merchant}</p>
                  <p>Date: {receipt.date}</p>
                  <p>Total: {receipt.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Existing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Merchant: {duplicate.merchant}</p>
                  <p>Date: {duplicate.date}</p>
                  <p>Total: {duplicate.total}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
