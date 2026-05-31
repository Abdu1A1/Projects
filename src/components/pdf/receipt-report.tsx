import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { Receipt } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

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

export function ReceiptReport({
  summary,
  receipts,
}: {
  summary: string;
  receipts: Receipt[];
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
