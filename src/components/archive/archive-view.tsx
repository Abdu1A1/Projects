"use client";

import { useMemo, useState } from "react";

import { ReceiptCard } from "@/components/receipt/receipt-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ReceiptRecord } from "@/types/receipt";

export function ArchiveView({ receipts, customCategories }: { receipts: ReceiptRecord[]; customCategories: string[] }) {
  const [mode, setMode] = useState<"time" | "merchant">("time");
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [newCategory, setNewCategory] = useState("");
  const [categories, setCategories] = useState(customCategories);

  const folders = useMemo(() => {
    if (mode === "merchant") {
      const merchants = Array.from(new Set(receipts.map((receipt) => receipt.merchant).filter(Boolean) as string[])).sort();
      return merchants.map((merchant) => ({ key: merchant, label: merchant }));
    }

    const grouped = new Set<string>();
    receipts.forEach((receipt) => {
      if (!receipt.date) return;
      const date = new Date(`${receipt.date}T00:00:00`);
      const key = `${date.getFullYear()} > ${date.toLocaleString("default", { month: "long" })} > ${receipt.category ?? "Other"}`;
      grouped.add(key);
    });

    return Array.from(grouped).sort().map((value) => ({ key: value, label: value }));
  }, [mode, receipts]);

  const filtered = useMemo(() => {
    if (selectedFolder === "all") return receipts;
    if (mode === "merchant") {
      return receipts.filter((receipt) => receipt.merchant === selectedFolder);
    }

    return receipts.filter((receipt) => {
      if (!receipt.date) return false;
      const date = new Date(`${receipt.date}T00:00:00`);
      const key = `${date.getFullYear()} > ${date.toLocaleString("default", { month: "long" })} > ${receipt.category ?? "Other"}`;
      return key === selectedFolder;
    });
  }, [mode, receipts, selectedFolder]);

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;

    setCategories((current) => (current.includes(name) ? current : [...current, name]));
    setNewCategory("");

    await fetch("/api/receipts/query", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_custom_category", name }),
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Folders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button variant={mode === "time" ? "default" : "outline"} onClick={() => setMode("time")}>
              By Time
            </Button>
            <Button variant={mode === "merchant" ? "default" : "outline"} onClick={() => setMode("merchant")}>
              By Merchant
            </Button>
          </div>

          <button
            onClick={() => setSelectedFolder("all")}
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            All Receipts
          </button>

          <div className="max-h-72 space-y-2 overflow-y-auto">
            {folders.map((folder) => (
              <button
                key={folder.key}
                onClick={() => setSelectedFolder(folder.key)}
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-left text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {folder.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
            <p className="text-xs font-medium">Custom category folders</p>
            <div className="flex gap-2">
              <Input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="New folder" />
              <Button onClick={addCategory}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {categories.map((category) => (
                <Badge key={category} variant="secondary">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {filtered.length ? (
          filtered.map((receipt) => <ReceiptCard key={receipt.id} receipt={receipt} />)
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-sm text-zinc-500">No receipts in this folder yet.</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
