import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteReceiptImage } from '@/lib/cloudinary';

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
      .select(`*, line_items(*), tags(*)`)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !receipt) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    return NextResponse.json({ receipt });
  } catch (error) {
    console.error('Get receipt error:', error);
    return NextResponse.json({ error: 'Failed to fetch receipt' }, { status: 500 });
  }
}

export async function PATCH(
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

    const body = await request.json();
    const { line_items, tags, original_category, ...receiptFields } = body;

    // Update receipt fields
    if (Object.keys(receiptFields).length > 0) {
      const { error } = await supabase
        .from('receipts')
        .update(receiptFields)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    }

    // Store correction for few-shot prompting if category was changed
    if (receiptFields.category && original_category && receiptFields.category !== original_category) {
      const { data: receipt } = await supabase
        .from('receipts')
        .select('merchant')
        .eq('id', id)
        .single();

      if (receipt?.merchant) {
        await supabase.from('user_corrections').insert({
          user_id: user.id,
          merchant: receipt.merchant,
          original_category,
          corrected_category: receiptFields.category,
        });
      }
    }

    // Update line items if provided
    if (line_items !== undefined) {
      await supabase.from('line_items').delete().eq('receipt_id', id);
      if (line_items.length > 0) {
        await supabase.from('line_items').insert(
          line_items.map((item: { name: string; qty: number; price: number }) => ({
            receipt_id: id,
            ...item,
          }))
        );
      }
    }

    // Update tags if provided
    if (tags !== undefined) {
      await supabase.from('tags').delete().eq('receipt_id', id);
      if (tags.length > 0) {
        await supabase.from('tags').insert(
          tags.map((label: string) => ({
            receipt_id: id,
            label,
          }))
        );
      }
    }

    const { data: updated } = await supabase
      .from('receipts')
      .select(`*, line_items(*), tags(*)`)
      .eq('id', id)
      .single();

    return NextResponse.json({ receipt: updated });
  } catch (error) {
    console.error('Update receipt error:', error);
    return NextResponse.json({ error: 'Failed to update receipt' }, { status: 500 });
  }
}

export async function DELETE(
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

    // Get image URL before deletion
    const { data: receipt } = await supabase
      .from('receipts')
      .select('image_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    // Delete from database (cascades to line_items and tags)
    const { error } = await supabase
      .from('receipts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    // Delete from Cloudinary
    if (receipt?.image_url) {
      await deleteReceiptImage(receipt.image_url);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete receipt error:', error);
    return NextResponse.json({ error: 'Failed to delete receipt' }, { status: 500 });
  }
}
