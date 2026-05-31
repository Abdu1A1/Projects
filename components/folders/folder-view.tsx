"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { groupReceiptsByMerchant, groupReceiptsByTime } from "@/lib/receipts";
import type { Receipt } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  receipts: Receipt[];
  customCategories: Array<{ id: string; name: string }>;
};

export function FolderView({ receipts, customCategories }: Props) {
  const [mode, setMode] = useState<"time" | "merchant">("time");
  const [folderName, setFolderName] = useState("");

  const groupedByTime = useMemo(() => groupReceiptsByTime(receipts), [receipts]);
  const groupedByMerchant = useMemo(() => groupReceiptsByMerchant(receipts), [receipts]);

  const createFolder = async () => {
    if (!folderName.trim()) return;

    await fetch("/api/receipts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ createCustomCategory: folderName.trim() }),
    });

    setFolderName("");
    location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          variant={mode === "time" ? "default" : "outline"}
          onClick={() => setMode("time")}
        >
          By Time
        </Button>
        <Button
          variant={mode === "merchant" ? "default" : "outline"}
          onClick={() => setMode("merchant")}
        >
          By Merchant
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom Category Folders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              placeholder="Create custom folder"
            />
            <Button type="button" variant="outline" onClick={createFolder}>
              Create
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {customCategories.map((category) => (
              <span
                key={category.id}
                className="rounded-full border px-3 py-1 text-xs text-muted-foreground"
              >
                {category.name}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {mode === "time" ? (
        <div className="space-y-4">
          {Object.entries(groupedByTime)
            .sort((a, b) => Number(b[0]) - Number(a[0]))
            .map(([year, months]) => (
              <Card key={year}>
                <CardHeader>
                  <CardTitle>{year}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(months).map(([month, categories]) => (
                    <div key={month}>
                      <p className="mb-2 font-medium">{month}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {Object.entries(categories).map(([category, list]) => (
                          <Link
                            key={`${month}-${category}`}
                            href={`/library?category=${encodeURIComponent(category)}&from=${year}-${String(new Date(`${month} 1, ${year}`).getMonth() + 1).padStart(2, "0")}-01`}
                            className="rounded-lg border p-3 hover:bg-muted"
                          >
                            <p className="font-medium">{category}</p>
                            <p className="text-sm text-muted-foreground">
                              {list.length} receipts
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Merchant Folders</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {groupedByMerchant.map(([merchant, list]) => (
              <Link
                key={merchant}
                href={`/library?search=${encodeURIComponent(merchant)}`}
                className="rounded-lg border p-3 hover:bg-muted"
              >
                <p className="font-medium">{merchant}</p>
                <p className="text-sm text-muted-foreground">{list.length} receipts</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
