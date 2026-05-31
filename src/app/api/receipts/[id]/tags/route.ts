import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { label } = await request.json();
  if (!label || typeof label !== 'string') {
    return NextResponse.json({ error: 'invalid_label' }, { status: 400 });
  }

  const { data: receipt } = await supabase
    .from('receipts')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!receipt) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const { data, error } = await supabase
    .from('tags')
    .insert({ receipt_id: params.id, label: label.trim() })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, tag: data });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

  await supabase.from('tags').delete().eq('id', id).eq('receipt_id', params.id);
  return NextResponse.json({ ok: true });
}
