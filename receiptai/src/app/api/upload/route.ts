import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadReceiptImage } from '@/lib/cloudinary';
import { parseReceiptWithClaude } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary with auto improvement
    const imageUrl = await uploadReceiptImage(buffer, file.name, file.type);

    // Get user corrections for few-shot prompting
    const { data: corrections } = await supabase
      .from('user_corrections')
      .select('merchant, original_category, corrected_category')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Parse receipt with Claude
    let extraction;
    let confidence = 0;

    try {
      extraction = await parseReceiptWithClaude(imageUrl, corrections || []);
      confidence = extraction.confidence;
    } catch (claudeError) {
      console.error('Claude extraction failed:', claudeError);
      // Save receipt with minimal data if Claude fails
      const { data: receipt, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          confidence: 0,
          flags: ['low_confidence'],
          currency: 'CAD',
        })
        .select()
        .single();

      if (receiptError) throw receiptError;
      return NextResponse.json({ receipt, warning: 'AI extraction failed — please review manually' });
    }

    // Insert receipt
    const { data: receipt, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        user_id: user.id,
        image_url: imageUrl,
        merchant: extraction.merchant,
        date: extraction.date,
        time: extraction.time,
        total: extraction.total,
        tax: extraction.tax,
        currency: extraction.currency || 'CAD',
        payment_method: extraction.payment_method,
        category: extraction.category,
        summary: extraction.summary,
        flags: extraction.flags,
        confidence,
      })
      .select()
      .single();

    if (receiptError) throw receiptError;

    // Insert line items
    if (extraction.line_items && extraction.line_items.length > 0) {
      const lineItems = extraction.line_items.map((item) => ({
        receipt_id: receipt.id,
        name: item.name,
        qty: item.qty,
        price: item.price,
      }));

      await supabase.from('line_items').insert(lineItems);
    }

    return NextResponse.json({ receipt });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
