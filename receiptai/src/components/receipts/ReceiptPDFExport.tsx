'use client';

import { useState } from 'react';
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

      if (!data.receipts) throw new Error('No data');

      const receipts: Receipt[] = data.receipts;

      // Build a simple text-based PDF using canvas-free approach
      // Generate HTML content and use window.print()
      const printContent = generatePrintHTML(receipts);
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to export PDF');
        return;
      }

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
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

function generatePrintHTML(receipts: Receipt[]): string {
  const total = receipts.reduce((sum, r) => sum + (r.total || 0), 0);
  const byCategory: Record<string, { count: number; total: number }> = {};
  receipts.forEach((r) => {
    const cat = r.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = { count: 0, total: 0 };
    byCategory[cat].count++;
    byCategory[cat].total += r.total || 0;
  });

  const rows = receipts
    .map(
      (r) => `
    <tr>
      <td>${r.date || '—'}</td>
      <td>${r.merchant || '—'}</td>
      <td>${r.category || '—'}</td>
      <td>${r.payment_method || '—'}</td>
      <td style="text-align:right">${r.total != null ? `$${r.total.toFixed(2)}` : '—'}</td>
      <td style="text-align:right">${r.tax != null ? `$${r.tax.toFixed(2)}` : '—'}</td>
    </tr>`
    )
    .join('');

  const categoryRows = Object.entries(byCategory)
    .sort((a, b) => b[1].total - a[1].total)
    .map(
      ([cat, data]) =>
        `<tr><td>${cat}</td><td>${data.count}</td><td style="text-align:right">$${data.total.toFixed(2)}</td></tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <title>ReceiptAI — Receipt Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111; padding: 40px; }
    h1 { font-size: 24px; font-weight: bold; margin-bottom: 4px; color: #4f46e5; }
    .subtitle { color: #6b7280; font-size: 13px; margin-bottom: 32px; }
    h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; margin-top: 28px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 8px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #374151; }
    td { padding: 7px 8px; border-bottom: 1px solid #f3f4f6; }
    tr:last-child td { border-bottom: none; }
    .summary { display: flex; gap: 24px; margin-bottom: 32px; }
    .stat { background: #f9fafb; padding: 16px 20px; border-radius: 8px; flex: 1; }
    .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px; }
    .stat-value { font-size: 22px; font-weight: bold; color: #111; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <h1>ReceiptAI</h1>
  <div class="subtitle">Receipt Report — Generated ${new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  
  <div class="summary">
    <div class="stat">
      <div class="stat-label">Total Receipts</div>
      <div class="stat-value">${receipts.length}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Total Amount</div>
      <div class="stat-value">$${total.toFixed(2)}</div>
    </div>
  </div>

  <h2>Spending by Category</h2>
  <table>
    <thead><tr><th>Category</th><th>Receipts</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${categoryRows}</tbody>
  </table>

  <h2>All Receipts</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th><th>Merchant</th><th>Category</th><th>Payment</th>
        <th style="text-align:right">Total</th><th style="text-align:right">Tax</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}
