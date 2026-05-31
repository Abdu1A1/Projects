import { NextResponse } from 'next/server';
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { fetchReceipts, type ReceiptFilter } from '@/lib/receipts/queries';
import { computeDashboardStats } from '@/lib/receipts/stats';
import { formatCurrency } from '@/lib/utils';

export const runtime = 'nodejs';

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica' },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#666', marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: 700, marginTop: 16, marginBottom: 8 },
  stat: { marginBottom: 4 },
  row: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#ccc', paddingVertical: 4 },
  headerRow: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 6, paddingHorizontal: 2, fontWeight: 700 },
  cellDate: { width: '15%' },
  cellMerchant: { width: '30%' },
  cellCategory: { width: '20%' },
  cellTotal: { width: '15%', textAlign: 'right' },
  cellTax: { width: '10%', textAlign: 'right' },
  cellFlag: { width: '10%' },
});

function Report({
  receipts,
  stats,
  month,
}: {
  receipts: any[];
  stats: any;
  month: string;
}) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(Text, { style: styles.title }, 'ReceiptAI Report'),
      React.createElement(Text, { style: styles.subtitle }, `Generated ${new Date().toLocaleString('en-CA')} · ${month}`),
      React.createElement(Text, { style: styles.sectionTitle }, 'Summary'),
      React.createElement(Text, { style: styles.stat }, `Total this month: ${formatCurrency(stats.monthTotal, stats.currency)}`),
      React.createElement(Text, { style: styles.stat }, `Receipts this month: ${stats.monthReceiptCount}`),
      React.createElement(
        Text,
        { style: styles.stat },
        `Top category: ${stats.topCategory?.category ?? '—'}${stats.topCategory ? ` (${formatCurrency(stats.topCategory.total, stats.currency)})` : ''}`,
      ),
      React.createElement(
        Text,
        { style: styles.stat },
        `Top merchant: ${stats.topMerchant?.merchant ?? '—'}${stats.topMerchant ? ` (${stats.topMerchant.count} visits)` : ''}`,
      ),
      React.createElement(Text, { style: styles.sectionTitle }, `Receipts (${receipts.length})`),
      React.createElement(
        View,
        { style: styles.headerRow },
        React.createElement(Text, { style: styles.cellDate }, 'Date'),
        React.createElement(Text, { style: styles.cellMerchant }, 'Merchant'),
        React.createElement(Text, { style: styles.cellCategory }, 'Category'),
        React.createElement(Text, { style: styles.cellTotal }, 'Total'),
        React.createElement(Text, { style: styles.cellTax }, 'Tax'),
        React.createElement(Text, { style: styles.cellFlag }, 'Flags'),
      ),
      ...receipts.map((r) =>
        React.createElement(
          View,
          { style: styles.row, key: r.id },
          React.createElement(Text, { style: styles.cellDate }, r.date ?? '—'),
          React.createElement(Text, { style: styles.cellMerchant }, r.merchant ?? '—'),
          React.createElement(Text, { style: styles.cellCategory }, r.category ?? '—'),
          React.createElement(Text, { style: styles.cellTotal }, r.total !== null ? formatCurrency(r.total, r.currency ?? 'CAD') : '—'),
          React.createElement(Text, { style: styles.cellTax }, r.tax !== null && r.tax !== undefined ? formatCurrency(r.tax, r.currency ?? 'CAD') : '—'),
          React.createElement(Text, { style: styles.cellFlag }, (r.flags ?? []).length ? (r.flags ?? []).join(', ') : '—'),
        ),
      ),
    ),
  );
}

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const sp = (k: string) => url.searchParams.get(k) ?? undefined;
  const filter: ReceiptFilter = {
    q: sp('q'),
    category: sp('category'),
    flag: sp('flag'),
    dateFrom: sp('from'),
    dateTo: sp('to'),
    minAmount: sp('min') ? Number(sp('min')) : undefined,
    maxAmount: sp('max') ? Number(sp('max')) : undefined,
    sort: (sp('sort') as any) || 'date',
    order: (sp('order') as any) || 'desc',
  };
  const receipts = await fetchReceipts(supabase, user.id, filter);
  const stats = computeDashboardStats(receipts as any);
  const month = new Date().toLocaleString('en-CA', { month: 'long', year: 'numeric' });

  const buffer = await renderToBuffer(
    Report({ receipts, stats, month }) as any,
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="receipts-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
