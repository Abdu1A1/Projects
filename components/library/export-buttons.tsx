"use client";

import { useMemo } from "react";
import Papa from "papaparse";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import type { Receipt } from "@/lib/types";
import { Button } from "@/components/ui/button";

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 11 },
  title: { fontSize: 16, marginBottom: 10 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1px solid #e5e7eb",
    paddingVertical: 4,
  },
  heading: { fontWeight: 700, marginBottom: 6 },
});

function ReceiptReport({ receipts }: { receipts: Receipt[] }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>ReceiptAI Monthly Report</Text>
        <View style={styles.row}>
          <Text style={styles.heading}>Merchant</Text>
          <Text style={styles.heading}>Category</Text>
          <Text style={styles.heading}>Date</Text>
          <Text style={styles.heading}>Total</Text>
        </View>
        {receipts.map((receipt) => (
          <View key={receipt.id} style={styles.row}>
            <Text>{receipt.merchant || "Unknown"}</Text>
            <Text>{receipt.category || "Other"}</Text>
            <Text>{receipt.date || "-"}</Text>
            <Text>{receipt.total?.toFixed(2) ?? "-"}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExportButtons({ receipts }: { receipts: Receipt[] }) {
  const rows = useMemo(
    () =>
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
        flags: (receipt.flags ?? []).join("|"),
        confidence: receipt.confidence,
        image_url: receipt.image_url,
        created_at: receipt.created_at,
      })),
    [receipts],
  );

  const exportCsv = () => {
    const csv = Papa.unparse(rows);
    downloadBlob("receipts.csv", new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  };

  const exportPdf = async () => {
    const blob = await pdf(<ReceiptReport receipts={receipts} />).toBlob();
    downloadBlob("receipts-report.pdf", blob);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={exportCsv}>
        Export CSV
      </Button>
      <Button type="button" variant="outline" onClick={exportPdf}>
        Export PDF
      </Button>
    </div>
  );
}
