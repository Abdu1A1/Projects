import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CATEGORIES } from '@/lib/constants';

const EDITABLE_FIELDS = new Set([
  'merchant',
  'date',
  'time',
  'total',
  'tax',
  'currency',
  'payment_method',
  'category',
  'summary',
]);

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json();
  const correction = body._correction as
    | { merchant?: string | null; original_category?: string | null }
    | undefined;
  delete body._correction;

  const update: Record<string, any> = {};
  for (const [k, v] of Object.entries(body)) {
    if (EDITABLE_FIELDS.has(k)) update[k] = v;
  }
  if (update.category && !CATEGORIES.includes(update.category)) {
    return NextResponse.json({ error: 'invalid_category' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('receipts')
    .update(update)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (
    correction &&
    update.category &&
    correction.original_category &&
    update.category !== correction.original_category
  ) {
    await supabase.from('user_corrections').insert({
      user_id: user.id,
      merchant: correction.merchant ?? null,
      original_category: correction.original_category,
      corrected_category: update.category,
    });
  }

  return NextResponse.json({ ok: true, receipt: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('receipts')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
