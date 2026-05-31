import 'server-only';
import { v2 as cloudinary } from 'cloudinary';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export async function uploadReceiptImage(
  buffer: Buffer,
  mimetype: string,
  userId: string,
): Promise<{ url: string; publicId: string }> {
  ensureConfigured();

  const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `receiptai/${userId}`,
    resource_type: 'auto',
    transformation: [{ effect: 'auto:improvement' }],
  });

  return { url: result.secure_url, publicId: result.public_id };
}
