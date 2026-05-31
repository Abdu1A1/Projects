import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) throw error;

    return NextResponse.json({ categories: categories || [] });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Category name required' }, { status: 400 });
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        user_id: user.id,
        name: name.trim(),
        is_custom: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
