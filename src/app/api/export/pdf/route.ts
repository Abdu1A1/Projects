import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { startOfMonth, endOfMonth } from "date-fns";

import { getDashboardData, getReceipts } from "@/lib/receipt-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const runtime = "nodejs";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    marginBottom: 8,
  },
  subtitle: {
    color: "#475569",
    lineHeight: 1.5,
  },
  section: {
    marginBottom: 18,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#eef2ff",
    borderRadius: 8,
    padding: 8,
    fontWeight: 700,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 8,
  },
  cellMerchant: {
    width: "28%",
    paddingRight: 8,
  },
  cellDate: {
    width: "16%",
    paddingRight: 8,
  },
  cellCategory: {
    width: "20%",
    paddingRight: 8,
  },
  cellAmount: {
    width: "16%",
    paddingRight: 8,
  },
  cellFlags: {
    width: "20%",
  },
});

function ReceiptReport({
  summary,
  receipts,
}: {
  summary: string;
  receipts: Awaited<ReturnType<typeof getReceipts>>;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>ReceiptAI monthly report</Text>
          <Text style={styles.subtitle}>{summary}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={styles.cellMerchant}>Merchant</Text>
            <Text style={styles.cellDate}>Date</Text>
            <Text style={styles.cellCategory}>Category</Text>
            <Text style={styles.cellAmount}>Total</Text>
            <Text style={styles.cellFlags}>Flags</Text>
          </View>
          {receipts.map((receipt) => (
            <View key={receipt.id} style={styles.row}>
              <Text style={styles.cellMerchant}>{receipt.merchant || "Unknown"}</Text>
              <Text style={styles.cellDate}>{receipt.date || "—"}</Text>
              <Text style={styles.cellCategory}>{receipt.category || "Other"}</Text>
              <Text style={styles.cellAmount}>{formatCurrency(receipt.total, receipt.currency ?? "CAD")}</Text>
              <Text style={styles.cellFlags}>{receipt.flags?.join(", ") || "—"}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

export async function GET() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const [dashboard, receipts] = await Promise.all([
    getDashboardData(user.id),
    getReceipts(user.id, {
      startDate: startOfMonth(new Date()).toISOString().slice(0, 10),
      endDate: endOfMonth(new Date()).toISOString().slice(0, 10),
      sort: "date",
      order: "desc",
    }),
  ]);

  const pdf = await renderToBuffer(<ReceiptReport summary={dashboard.aiSummary} receipts={receipts} />);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="receiptai-report-${new Date().toISOString().slice(0, 7)}.pdf"`,
    },
  });
}
