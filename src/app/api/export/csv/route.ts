import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { createClient } from '@/lib/supabase/server';
import { fetchReceipts, type ReceiptFilter } from '@/lib/receipts/queries';

export const runtime = 'nodejs';

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

  const rows = receipts.map((r) => ({
    id: r.id,
    date: r.date ?? '',
    time: r.time ?? '',
    merchant: r.merchant ?? '',
    category: r.category ?? '',
    total: r.total ?? '',
    tax: r.tax ?? '',
    currency: r.currency ?? '',
    payment_method: r.payment_method ?? '',
    flags: (r.flags ?? []).join('|'),
    tags: (r.tags ?? []).map((t) => t.label).join('|'),
    line_items: (r.line_items ?? [])
      .map((li) => `${li.name} (x${li.qty}) ${li.price}`)
      .join(' | '),
    summary: r.summary ?? '',
    confidence: r.confidence ?? '',
    image_url: r.image_url ?? '',
    created_at: r.created_at,
  }));

  const csv = Papa.unparse(rows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="receipts-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
