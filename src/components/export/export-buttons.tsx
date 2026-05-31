"use client";

import Papa from "papaparse";
import { pdf } from "@react-pdf/renderer";

import { Button } from "@/components/ui/button";
import { MonthlyPdfReport } from "@/lib/export/monthly-pdf";
import type { ReceiptRecord } from "@/types/receipt";

export function ExportButtons({ receipts, monthlySummary }: { receipts: ReceiptRecord[]; monthlySummary: string }) {
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
        flags: receipt.flags?.join(", "),
        confidence: receipt.confidence,
        created_at: receipt.created_at,
      })),
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "receipts.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    const doc = <MonthlyPdfReport summary={monthlySummary} receipts={receipts} />;
    const blob = await pdf(doc).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "receiptai-monthly-report.pdf";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={exportCsv}>
        Export CSV
      </Button>
      <Button variant="outline" onClick={exportPdf}>
        Export PDF
      </Button>
    </div>
  );
}
