import React from "react";
import { NextResponse } from "next/server";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { requireApiUser } from "@/lib/auth";
import { getDashboardData, getReceipts } from "@/lib/data/repository";
import { formatCurrency } from "@/lib/format";
import { normalizeFilters } from "@/lib/search";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, color: "#111827" },
  header: { marginBottom: 18 },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 8 },
  section: { marginBottom: 18 },
  summary: { fontSize: 11, lineHeight: 1.5 },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 8,
    gap: 8,
  },
  cellMerchant: { width: "30%" },
  cellDate: { width: "18%" },
  cellCategory: { width: "20%" },
  cellTotal: { width: "16%", textAlign: "right" },
  cellFlags: { width: "16%" },
  headerRow: { fontWeight: 700, backgroundColor: "#f3f4f6" },
});

export async function GET(request: Request) {
  try {
    const user = await requireApiUser();
    const url = new URL(request.url);
    const filters = normalizeFilters(Object.fromEntries(url.searchParams.entries()));
    const [receipts, dashboard] = await Promise.all([getReceipts(user.id, filters), getDashboardData(user.id)]);

    const doc = React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: "A4", style: styles.page },
        React.createElement(
          View,
          { style: styles.header },
          React.createElement(Text, { style: styles.title }, "ReceiptAI monthly report"),
          React.createElement(Text, null, dashboard.monthlySummary.monthLabel),
        ),
        React.createElement(
          View,
          { style: styles.section },
          React.createElement(Text, { style: styles.summary }, dashboard.monthlySummary.text),
          React.createElement(Text, { style: styles.summary }, `Total spent this month: ${formatCurrency(dashboard.stats.totalSpentThisMonth)}`),
          React.createElement(Text, { style: styles.summary }, `Top category: ${dashboard.stats.topCategory}`),
          React.createElement(Text, { style: styles.summary }, `Highest single receipt: ${formatCurrency(dashboard.stats.highestReceipt)}`),
        ),
        React.createElement(
          View,
          { style: [styles.row, styles.headerRow] },
          React.createElement(Text, { style: styles.cellMerchant }, "Merchant"),
          React.createElement(Text, { style: styles.cellDate }, "Date"),
          React.createElement(Text, { style: styles.cellCategory }, "Category"),
          React.createElement(Text, { style: styles.cellTotal }, "Total"),
          React.createElement(Text, { style: styles.cellFlags }, "Flags"),
        ),
        ...receipts.map((receipt) =>
          React.createElement(
            View,
            { key: receipt.id, style: styles.row },
            React.createElement(Text, { style: styles.cellMerchant }, receipt.merchant || "Unknown"),
            React.createElement(Text, { style: styles.cellDate }, receipt.date || "-"),
            React.createElement(Text, { style: styles.cellCategory }, receipt.category || "Other"),
            React.createElement(Text, { style: styles.cellTotal }, formatCurrency(receipt.total, receipt.currency)),
            React.createElement(Text, { style: styles.cellFlags }, receipt.flags.join(", ") || "-"),
          ),
        ),
      ),
    );

    const buffer = await renderToBuffer(doc);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="receiptai-report.pdf"',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to export PDF.";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
