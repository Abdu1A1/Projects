import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadedAsset {
  originalUrl: string;
  enhancedUrl: string;
  publicId: string;
}

export async function uploadReceiptFile(file: File): Promise<UploadedAsset> {
  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "receipt-ai",
        transformation: [{ effect: "auto:improve" }],
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }

        const enhancedUrl = cloudinary.url(result.public_id, {
          resource_type: result.resource_type as "image" | "video" | "raw",
          secure: true,
          transformation: [{ effect: "auto:improve" }],
        });

        resolve({
          originalUrl: result.secure_url,
          enhancedUrl,
          publicId: result.public_id,
        });
      },
    );

    stream.end(buffer);
  });
}
