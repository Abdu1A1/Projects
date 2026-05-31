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
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const amountMin = searchParams.get('amountMin') || '';
    const amountMax = searchParams.get('amountMax') || '';
    const flags = searchParams.getAll('flags');
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('receipts')
      .select(`
        *,
        line_items(*),
        tags(*)
      `, { count: 'exact' })
      .eq('user_id', user.id);

    // Full-text search
    if (search) {
      query = query.textSearch('search_vector', search, {
        type: 'websearch',
        config: 'english',
      });
    }

    // Category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Date range filter
    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('date', dateTo);
    }

    // Amount range filter
    if (amountMin) {
      query = query.gte('total', parseFloat(amountMin));
    }
    if (amountMax) {
      query = query.lte('total', parseFloat(amountMax));
    }

    // Flags filter
    if (flags.length > 0) {
      query = query.overlaps('flags', flags);
    }

    // Sort
    const validSortFields = ['date', 'total', 'merchant', 'category', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'date';
    query = query.order(sortField, { ascending: sortOrder === 'asc', nullsFirst: false });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: receipts, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ receipts, count });
  } catch (error) {
    console.error('Get receipts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipts' },
      { status: 500 }
    );
  }
}
