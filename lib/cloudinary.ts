import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { hasCloudinaryEnv } from "@/lib/env";

let configured = false;

function ensureConfigured() {
  if (!hasCloudinaryEnv()) {
    return false;
  }

  if (!configured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }

  return true;
}

export async function uploadReceiptAsset(file: File, userId: string) {
  if (!ensureConfigured()) {
    return {
      imageUrl: `https://placehold.co/800x1200/png?text=${encodeURIComponent(file.name)}`,
      aiUrl: `https://placehold.co/800x1200/png?text=${encodeURIComponent(file.name)}`,
      publicId: `mock-${Date.now()}`,
    };
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `receiptai/${userId}`,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
        transformation: [{ effect: "improve" }],
      },
      (error, value) => {
        if (error || !value) {
          reject(error || new Error("Upload failed"));
          return;
        }
        resolve(value);
      },
    );

    stream.end(buffer);
  });

  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  const aiUrl = isPdf
    ? cloudinary.url(result.public_id, {
        resource_type: "image",
        format: "png",
        secure: true,
        page: 1,
      })
    : cloudinary.url(result.public_id, {
        resource_type: result.resource_type,
        secure: true,
        transformation: [{ effect: "improve" }],
      });

  return {
    imageUrl: result.secure_url,
    aiUrl,
    publicId: result.public_id,
  };
}
