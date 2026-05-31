import { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'receipts';

export async function uploadReceiptImage(
  supabase: SupabaseClient,
  userId: string,
  file: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const ext = filename.split('.').pop() || 'jpg';
  const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteReceiptImage(
  supabase: SupabaseClient,
  imageUrl: string
): Promise<void> {
  try {
    const url = new URL(imageUrl);
    const parts = url.pathname.split('/');
    const bucketIndex = parts.indexOf(BUCKET);
    if (bucketIndex === -1) return;

    const path = parts.slice(bucketIndex + 1).join('/');
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    // Non-critical: don't fail if image deletion fails
  }
}
