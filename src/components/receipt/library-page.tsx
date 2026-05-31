"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ExportButtons } from "@/components/export/export-buttons";
import { LibraryControls } from "@/components/receipt/library-controls";
import { ReceiptCard } from "@/components/receipt/receipt-card";
import { UploadQueue } from "@/components/receipt/upload-queue";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReceiptRecord } from "@/types/receipt";

interface QueryResponse {
  receipts: ReceiptRecord[];
  monthlySummary: string;
}

export function LibraryPage() {
  const searchParams = useSearchParams();
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [monthlySummary, setMonthlySummary] = useState("Upload receipts to see your spending summary.");
  const [loading, setLoading] = useState(true);

  const queryString = useMemo(() => searchParams.toString(), [searchParams]);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    const response = await fetch(`/api/receipts/query?${queryString}`);
    if (response.ok) {
      const body = (await response.json()) as QueryResponse;
      setReceipts(body.receipts);
      setMonthlySummary(body.monthlySummary);
    }
    setLoading(false);
  }, [queryString]);

  useEffect(() => {
    void fetchReceipts();
  }, [fetchReceipts]);

  return (
    <div className="space-y-4">
      <UploadQueue onComplete={fetchReceipts} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">Receipt Library</h1>
          <ExportButtons receipts={receipts} monthlySummary={monthlySummary} />
        </div>

        <LibraryControls />

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full" />
            ))}
          </div>
        ) : receipts.length ? (
          <div className="grid gap-3">
            {receipts.map((receipt) => (
              <ReceiptCard key={receipt.id} receipt={receipt} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-sm text-zinc-500">
              No receipts yet — tap the camera to add your first one.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
