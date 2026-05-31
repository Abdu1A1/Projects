"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format } from "date-fns";

import { createCustomCategoryAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Receipt } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

function groupByTime(receipts: Receipt[]) {
  return receipts.reduce<Record<string, Record<string, Record<string, Receipt[]>>>>((acc, receipt) => {
    if (!receipt.date) {
      return acc;
    }
    const date = new Date(`${receipt.date}T00:00:00`);
    const year = format(date, "yyyy");
    const month = format(date, "MMMM");
    const category = receipt.category || "Other";
    acc[year] ??= {};
    acc[year][month] ??= {};
    acc[year][month][category] ??= [];
    acc[year][month][category].push(receipt);
    return acc;
  }, {});
}

function groupByMerchant(receipts: Receipt[]) {
  return receipts.reduce<Record<string, Receipt[]>>((acc, receipt) => {
    const merchant = receipt.merchant || "Unknown merchant";
    acc[merchant] ??= [];
    acc[merchant].push(receipt);
    return acc;
  }, {});
}

export function ArchiveView({
  receipts,
  customCategories,
}: {
  receipts: Receipt[];
  customCategories: string[];
}) {
  const [filter, setFilter] = useState("");
  const groupedByTime = useMemo(() => groupByTime(receipts), [receipts]);
  const groupedByMerchant = useMemo(() => groupByMerchant(receipts), [receipts]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Custom category folders</CardTitle>
          <CardDescription>Create folders that appear alongside AI categories in your archive flows.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={createCustomCategoryAction} className="flex flex-col gap-3 sm:flex-row">
            <Input name="name" placeholder="For example: Client expenses" />
            <Button type="submit">Create folder</Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {customCategories.map((category) => (
              <Badge key={category} variant="outline">
                {category}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="time">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <TabsList>
            <TabsTrigger value="time">By time</TabsTrigger>
            <TabsTrigger value="merchant">By merchant</TabsTrigger>
          </TabsList>
          <Input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter folders" className="md:max-w-xs" />
        </div>

        <TabsContent value="time">
          <div className="space-y-4">
            {Object.entries(groupedByTime)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([year, months]) => (
                <Card key={year}>
                  <CardHeader>
                    <CardTitle>{year}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(months)
                      .filter(([month]) => month.toLowerCase().includes(filter.toLowerCase()))
                      .map(([month, categories]) => (
                        <div key={month} className="space-y-3">
                          <h3 className="font-medium">{month}</h3>
                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {Object.entries(categories).map(([category, bucket]) => (
                              <Link
                                key={`${month}-${category}`}
                                href={`/library?category=${encodeURIComponent(category)}&start=${bucket
                                  .map((receipt) => receipt.date)
                                  .filter(Boolean)
                                  .sort()[0] ?? ""}&end=${bucket
                                  .map((receipt) => receipt.date)
                                  .filter(Boolean)
                                  .sort()
                                  .slice(-1)[0] ?? ""}`}
                              >
                                <Card className="border-dashed transition-transform hover:-translate-y-0.5">
                                  <CardContent className="space-y-2 p-5">
                                    <div className="flex items-center justify-between">
                                      <p className="font-medium">{category}</p>
                                      <Badge variant="accent">{bucket.length}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {formatCurrency(
                                        bucket.reduce((sum, receipt) => sum + (receipt.total ?? 0), 0),
                                        bucket[0]?.currency ?? "CAD",
                                      )}
                                    </p>
                                  </CardContent>
                                </Card>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="merchant">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Object.entries(groupedByMerchant)
              .filter(([merchant]) => merchant.toLowerCase().includes(filter.toLowerCase()))
              .sort((a, b) => b[1].length - a[1].length)
              .map(([merchant, bucket]) => (
                <Link key={merchant} href={`/library?q=${encodeURIComponent(merchant)}`}>
                  <Card className="transition-transform hover:-translate-y-0.5">
                    <CardContent className="space-y-2 p-5">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{merchant}</p>
                        <Badge variant="accent">{bucket.length}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(
                          bucket.reduce((sum, receipt) => sum + (receipt.total ?? 0), 0),
                          bucket[0]?.currency ?? "CAD",
                        )}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
