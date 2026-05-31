import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Papa from 'papaparse';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const category = searchParams.get('category') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    let query = supabase
      .from('receipts')
      .select(`*, line_items(*), tags(*)`)
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (category) query = query.eq('category', category);
    if (dateFrom) query = query.gte('date', dateFrom);
    if (dateTo) query = query.lte('date', dateTo);

    const { data: receipts, error } = await query;
    if (error) throw error;

    if (format === 'csv') {
      const rows = receipts?.map((r) => ({
        ID: r.id,
        Merchant: r.merchant || '',
        Date: r.date || '',
        Time: r.time || '',
        Total: r.total ?? '',
        Tax: r.tax ?? '',
        Currency: r.currency || 'CAD',
        'Payment Method': r.payment_method || '',
        Category: r.category || '',
        Summary: r.summary || '',
        Flags: (r.flags || []).join(', '),
        Confidence: r.confidence ?? '',
        'Line Items': r.line_items
          ?.map((li: { name: string; qty: number; price: number }) => `${li.name} x${li.qty} @ $${li.price}`)
          .join(' | ') || '',
        Tags: r.tags?.map((t: { label: string }) => t.label).join(', ') || '',
        'Image URL': r.image_url || '',
        'Created At': r.created_at || '',
      }));

      const csv = Papa.unparse(rows || []);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="receipts-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported format' }, { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
