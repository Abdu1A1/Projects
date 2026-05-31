"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Papa from "papaparse";
import { Download, FolderTree, Search, Share2 } from "lucide-react";
import { toast } from "sonner";
import { ReceiptCard } from "@/components/app/receipt-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Category, FolderGroup, Receipt, ReceiptFilters } from "@/lib/types";

function FolderTreeView({ groups }: { groups: FolderGroup[] }) {
  if (!groups.length) {
    return <div className="rounded-[1.5rem] border border-dashed p-8 text-sm text-muted-foreground">No folders matched those filters.</div>;
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderTree className="h-4 w-4 text-primary" />
              {group.label}
            </CardTitle>
            <CardDescription>{group.receipts.length} receipts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.children?.length ? <FolderTreeView groups={group.children} /> : null}
            {!group.children?.length ? (
              <div className="grid receipt-grid gap-4">
                {group.receipts.map((receipt) => (
                  <ReceiptCard key={receipt.id} receipt={receipt} />
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function LibraryPage({
  receipts,
  categories,
  filters,
  folderGroups,
}: {
  receipts: Receipt[];
  categories: Category[];
  filters: ReceiptFilters;
  folderGroups: FolderGroup[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [customCategory, setCustomCategory] = useState("");

  const params = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  const updateParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    router.replace(`${pathname}?${next.toString()}`);
  };

  const exportCsv = () => {
    const csv = Papa.unparse(
      receipts.map((receipt) => ({
        id: receipt.id,
        merchant: receipt.merchant,
        date: receipt.date,
        time: receipt.time,
        total: receipt.total,
        tax: receipt.tax,
        currency: receipt.currency,
        payment_method: receipt.payment_method,
        category: receipt.category,
        summary: receipt.summary,
        flags: receipt.flags.join("|"),
        confidence: receipt.confidence,
        image_url: receipt.image_url,
        raw_text: receipt.raw_text,
        line_items: receipt.line_items.map((item) => `${item.name} (${item.qty ?? ""} x ${item.price ?? ""})`).join("; "),
        tags: receipt.tags.map((tag) => tag.label).join("|"),
      })),
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "receiptai-export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const createCategory = async () => {
    if (!customCategory.trim()) return;
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: customCategory.trim() }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      toast.error(payload.error || "Unable to create folder.");
      return;
    }

    toast.success("Custom category folder created.");
    setCustomCategory("");
    router.refresh();
  };

  const copyShareLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Shareable filter link copied.");
  };

  const activeChips = [
    filters.category ? `Category: ${filters.category}` : null,
    filters.flag ? `Flag: ${filters.flag}` : null,
    filters.minAmount ? `Min: ${filters.minAmount}` : null,
    filters.maxAmount ? `Max: ${filters.maxAmount}` : null,
    filters.dateFrom ? `From: ${filters.dateFrom}` : null,
    filters.dateTo ? `To: ${filters.dateTo}` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Receipt library</h1>
          <p className="mt-2 text-sm text-muted-foreground">Search merchant names, line items, tags, and advanced filter chips with shareable URLs.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={exportCsv} type="button" variant="outline">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => window.open(`/api/export/pdf?${params.toString()}`, "_blank")} type="button" variant="outline">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={copyShareLink} type="button" variant="secondary">
            <Share2 className="h-4 w-4" />
            Copy link
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search terms like “gas april”, “over $100”, “milk”, or “costco”.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-10" defaultValue={filters.query || ""} onBlur={(event) => updateParam("query", event.target.value)} placeholder="Search receipts" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select defaultValue={filters.category || ""} onChange={(event) => updateParam("category", event.target.value)}>
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Flag</label>
                <Select defaultValue={filters.flag || ""} onChange={(event) => updateParam("flag", event.target.value)}>
                  <option value="">All flags</option>
                  <option value="high_tax">High tax</option>
                  <option value="possible_duplicate">Possible duplicate</option>
                  <option value="refund_detected">Refund detected</option>
                  <option value="missing_total">Missing total</option>
                  <option value="suspicious_charge">Suspicious charge</option>
                  <option value="low_confidence">Low confidence</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date from</label>
                <Input defaultValue={filters.dateFrom || ""} onBlur={(event) => updateParam("dateFrom", event.target.value)} type="date" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date to</label>
                <Input defaultValue={filters.dateTo || ""} onBlur={(event) => updateParam("dateTo", event.target.value)} type="date" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Min amount</label>
                <Input defaultValue={filters.minAmount?.toString() || ""} onBlur={(event) => updateParam("minAmount", event.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max amount</label>
                <Input defaultValue={filters.maxAmount?.toString() || ""} onBlur={(event) => updateParam("maxAmount", event.target.value)} type="number" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort</label>
                <Select defaultValue={filters.sort || "date"} onChange={(event) => updateParam("sort", event.target.value)}>
                  <option value="date">Date</option>
                  <option value="total">Total</option>
                  <option value="merchant">Merchant</option>
                  <option value="category">Category</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">View</label>
                <Select defaultValue={filters.view || "grid"} onChange={(event) => updateParam("view", event.target.value)}>
                  <option value="grid">Grid</option>
                  <option value="time">By time</option>
                  <option value="merchant">By merchant</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2 rounded-[1.5rem] bg-secondary/60 p-4">
              <p className="text-sm font-medium">Create custom category folder</p>
              <Input placeholder="e.g. Donations" value={customCategory} onChange={(event) => setCustomCategory(event.target.value)} />
              <Button className="w-full" onClick={createCategory} type="button" variant="secondary">
                Add folder
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {activeChips.length ? (
            <div className="flex flex-wrap gap-2">
              {activeChips.map((chip) => (
                <Badge key={chip}>{chip}</Badge>
              ))}
            </div>
          ) : null}

          {filters.view === "grid" ? (
            receipts.length ? (
              <div className="grid receipt-grid gap-4">
                {receipts.map((receipt) => (
                  <ReceiptCard key={receipt.id} receipt={receipt} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-10 text-center">
                  <p className="text-lg font-medium">No receipts matched these filters.</p>
                  <p className="mt-2 text-sm text-muted-foreground">Try a broader search or clear a chip to widen the results.</p>
                </CardContent>
              </Card>
            )
          ) : (
            <FolderTreeView groups={folderGroups} />
          )}
        </div>
      </div>
    </div>
  );
}
