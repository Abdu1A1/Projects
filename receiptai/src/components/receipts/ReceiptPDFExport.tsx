'use client';

import { useState } from 'react';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Receipt } from '@/types';

interface ReceiptPDFExportProps {
  filters?: {
    category?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#111' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#4f46e5', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#6b7280', marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', marginTop: 20, marginBottom: 8, borderBottom: '1pt solid #e5e7eb', paddingBottom: 4 },
  row: { flexDirection: 'row', borderBottom: '0.5pt solid #f3f4f6', paddingVertical: 5 },
  headerRow: { flexDirection: 'row', backgroundColor: '#f9fafb', paddingVertical: 6, fontWeight: 'bold' },
  cell: { flex: 1, paddingHorizontal: 4 },
  cellRight: { flex: 1, paddingHorizontal: 4, textAlign: 'right' },
  summaryRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#f9fafb', padding: 12, borderRadius: 6 },
  statLabel: { fontSize: 8, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold' },
});

function ReceiptReport({ receipts }: { receipts: Receipt[] }) {
  const total = receipts.reduce((sum, r) => sum + (r.total || 0), 0);
  const byCategory: Record<string, { count: number; total: number }> = {};
  receipts.forEach((r) => {
    const cat = r.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = { count: 0, total: 0 };
    byCategory[cat].count++;
    byCategory[cat].total += r.total || 0;
  });

  const generated = new Date().toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>ReceiptAI</Text>
        <Text style={styles.subtitle}>Receipt Report — Generated {generated}</Text>

        <View style={styles.summaryRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Receipts</Text>
            <Text style={styles.statValue}>{receipts.length}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Amount</Text>
            <Text style={styles.statValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Spending by Category</Text>
        <View style={styles.headerRow}>
          <Text style={styles.cell}>Category</Text>
          <Text style={styles.cell}>Receipts</Text>
          <Text style={styles.cellRight}>Total</Text>
        </View>
        {Object.entries(byCategory)
          .sort((a, b) => b[1].total - a[1].total)
          .map(([cat, data]) => (
            <View key={cat} style={styles.row}>
              <Text style={styles.cell}>{cat}</Text>
              <Text style={styles.cell}>{data.count}</Text>
              <Text style={styles.cellRight}>${data.total.toFixed(2)}</Text>
            </View>
          ))}

        <Text style={styles.sectionTitle}>All Receipts</Text>
        <View style={styles.headerRow}>
          <Text style={styles.cell}>Date</Text>
          <Text style={styles.cell}>Merchant</Text>
          <Text style={styles.cell}>Category</Text>
          <Text style={styles.cellRight}>Total</Text>
        </View>
        {receipts.map((r) => (
          <View key={r.id} style={styles.row}>
            <Text style={styles.cell}>{r.date || '—'}</Text>
            <Text style={styles.cell}>{r.merchant || '—'}</Text>
            <Text style={styles.cell}>{r.category || '—'}</Text>
            <Text style={styles.cellRight}>{r.total != null ? `$${r.total.toFixed(2)}` : '—'}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}

export function ReceiptPDFExport({ filters }: ReceiptPDFExportProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.set('category', filters.category);
      if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.set('dateTo', filters.dateTo);

      const response = await fetch(`/api/export/pdf?${params}`);
      const data = await response.json();

      if (!data.receipts?.length) {
        toast.error('No receipts to export');
        return;
      }

      const blob = await pdf(<ReceiptReport receipts={data.receipts} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipts-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch {
      toast.error('PDF export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      size="sm"
      disabled={loading}
      className="gap-2"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
      Export PDF
    </Button>
  );
}
