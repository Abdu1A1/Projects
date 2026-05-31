import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { name } = await request.json();
  if (!name || typeof name !== 'string') {
    return NextResponse.json({ error: 'invalid_name' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({ user_id: user.id, name: name.trim(), is_custom: true })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, category: data });
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name');
  return NextResponse.json({ categories: data ?? [] });
}
