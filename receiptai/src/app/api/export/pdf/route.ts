import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    let query = supabase
      .from('receipts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (category) query = query.eq('category', category);
    if (dateFrom) query = query.gte('date', dateFrom);
    if (dateTo) query = query.lte('date', dateTo);

    const { data: receipts, error } = await query;
    if (error) throw error;

    return NextResponse.json({ receipts });
  } catch {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
