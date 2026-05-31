import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadReceiptImage(
  file: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const base64 = `data:${mimeType};base64,${file.toString('base64')}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder: 'receiptai',
    public_id: `receipt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
    // auto:improvement for better readability
    effect: 'auto:improvement',
  });

  return result.secure_url;
}

export async function deleteReceiptImage(imageUrl: string): Promise<void> {
  try {
    const parts = imageUrl.split('/');
    const filename = parts[parts.length - 1].split('.')[0];
    const folder = parts[parts.length - 2];
    const publicId = `${folder}/${filename}`;
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // Non-critical: don't fail if image deletion fails
  }
}
