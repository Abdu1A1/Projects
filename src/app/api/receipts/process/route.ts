import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadReceiptImage } from '@/lib/cloudinary';
import { extractReceipt, type UserCorrection } from '@/lib/anthropic';
import { postProcessFlags, detectDuplicates } from '@/lib/receipts/post-process';
import { CATEGORIES } from '@/lib/constants';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimetype = file.type || 'image/jpeg';

  let imageUrl: string | null = null;

  try {
    const upload = await uploadReceiptImage(buffer, mimetype, user.id);
    imageUrl = upload.url;
  } catch (err: any) {
    return NextResponse.json(
      { error: 'upload_failed', detail: err?.message ?? 'Cloudinary upload failed' },
      { status: 502 },
    );
  }

  const { data: corrections } = await supabase
    .from('user_corrections')
    .select('merchant, original_category, corrected_category')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(8);

  let extracted;
  try {
    extracted = await extractReceipt(
      imageUrl!,
      mimetype,
      (corrections as UserCorrection[]) ?? [],
    );
  } catch (err: any) {
    const { data: row } = await supabase
      .from('receipts')
      .insert({
        user_id: user.id,
        image_url: imageUrl,
        confidence: 0,
        flags: ['low_confidence', 'missing_total'],
        summary: 'AI extraction failed — please review manually.',
      })
      .select('*')
      .single();
    return NextResponse.json(
      {
        ok: false,
        error: 'extraction_failed',
        detail: err?.message ?? 'Claude extraction failed',
        receipt: row,
      },
      { status: 200 },
    );
  }

  extracted = postProcessFlags(extracted);

  const isDup = await detectDuplicates(supabase, user.id, extracted);
  if (isDup && !extracted.flags.includes('possible_duplicate')) {
    extracted.flags.push('possible_duplicate');
  }

  const category =
    extracted.category && CATEGORIES.includes(extracted.category as any)
      ? extracted.category
      : 'Other';

  const { data: inserted, error: insertErr } = await supabase
    .from('receipts')
    .insert({
      user_id: user.id,
      image_url: imageUrl,
      merchant: extracted.merchant,
      date: extracted.date,
      time: extracted.time,
      total: extracted.total,
      tax: extracted.tax,
      currency: extracted.currency ?? 'CAD',
      payment_method: extracted.payment_method,
      category,
      summary: extracted.summary,
      flags: extracted.flags,
      confidence: extracted.confidence,
    })
    .select('*')
    .single();

  if (insertErr || !inserted) {
    return NextResponse.json(
      { error: 'db_insert_failed', detail: insertErr?.message },
      { status: 500 },
    );
  }

  if (extracted.line_items?.length) {
    const rows = extracted.line_items.map((li) => ({
      receipt_id: inserted.id,
      name: li.name,
      qty: li.qty,
      price: li.price,
    }));
    await supabase.from('line_items').insert(rows);
  }

  return NextResponse.json({ ok: true, receipt: inserted });
}
