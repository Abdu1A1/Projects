import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { ReceiptRecord } from "@/types/receipt";

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
  },
  title: {
    fontSize: 18,
    marginBottom: 12,
  },
  summary: {
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d4d4d8",
    paddingBottom: 4,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 3,
  },
  colMerchant: { width: "34%" },
  colDate: { width: "20%" },
  colCategory: { width: "22%" },
  colTotal: { width: "24%", textAlign: "right" },
});

export function MonthlyPdfReport({
  summary,
  receipts,
}: {
  summary: string;
  receipts: ReceiptRecord[];
}) {
  const monthTotal = receipts.reduce((sum, receipt) => sum + (receipt.total ?? 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>ReceiptAI Monthly Report</Text>
        <Text style={styles.summary}>{summary}</Text>
        <Text style={styles.summary}>Total receipts: {receipts.length}</Text>
        <Text style={styles.summary}>Total spent: {monthTotal.toFixed(2)}</Text>

        <View style={styles.tableHeader}>
          <Text style={styles.colMerchant}>Merchant</Text>
          <Text style={styles.colDate}>Date</Text>
          <Text style={styles.colCategory}>Category</Text>
          <Text style={styles.colTotal}>Total</Text>
        </View>

        {receipts.map((receipt) => (
          <View key={receipt.id} style={styles.row}>
            <Text style={styles.colMerchant}>{receipt.merchant ?? "Unknown"}</Text>
            <Text style={styles.colDate}>{receipt.date ?? "-"}</Text>
            <Text style={styles.colCategory}>{receipt.category ?? "Other"}</Text>
            <Text style={styles.colTotal}>{(receipt.total ?? 0).toFixed(2)}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
