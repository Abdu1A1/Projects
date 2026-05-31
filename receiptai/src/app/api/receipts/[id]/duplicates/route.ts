import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { subHours } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: receipt, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    if (!receipt.merchant || receipt.total == null) {
      return NextResponse.json({ duplicates: [] });
    }

    const since = subHours(new Date(), 24).toISOString();

    const { data: duplicates } = await supabase
      .from('receipts')
      .select(`*, line_items(*), tags(*)`)
      .eq('user_id', user.id)
      .eq('merchant', receipt.merchant)
      .eq('total', receipt.total)
      .neq('id', id)
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    return NextResponse.json({ duplicates: duplicates || [], receipt });
  } catch (error) {
    console.error('Duplicate lookup error:', error);
    return NextResponse.json({ error: 'Failed to find duplicates' }, { status: 500 });
  }
}
