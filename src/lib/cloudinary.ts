import { v2 as cloudinary } from "cloudinary";

import { env, hasCloudinaryEnv, requireEnv } from "@/lib/env";

let configured = false;

function configureCloudinary() {
  if (!configured) {
    cloudinary.config({
      cloud_name: requireEnv("CLOUDINARY_CLOUD_NAME"),
      api_key: requireEnv("CLOUDINARY_API_KEY"),
      api_secret: requireEnv("CLOUDINARY_API_SECRET"),
      secure: true,
    });
    configured = true;
  }

  return cloudinary;
}

export async function uploadReceiptAsset(userId: string, file: File) {
  if (!hasCloudinaryEnv()) {
    throw new Error("Cloudinary environment variables are not configured.");
  }

  const api = configureCloudinary();
  const buffer = Buffer.from(await file.arrayBuffer());
  const folder = `receiptai/${userId}`;
  const isPdf = file.type === "application/pdf";

  return new Promise<{
    secureUrl: string;
    publicId: string;
    bytes: number;
    resourceType: string;
  }>((resolve, reject) => {
    const stream = api.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        format: isPdf ? undefined : "jpg",
        transformation: isPdf
          ? undefined
          : [
              { effect: "improve" },
              { quality: "auto" },
              { fetch_format: "auto" },
            ],
        tags: ["receiptai", userId],
        context: {
          app: "receiptai",
          original_filename: file.name,
        },
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          resourceType: result.resource_type,
        });
      },
    );

    stream.end(buffer);
  });
}

export async function fetchUploadedAssetAsBase64(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch uploaded asset: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get("content-type") || "image/jpeg";

  return {
    base64: Buffer.from(arrayBuffer).toString("base64"),
    mediaType: contentType,
  };
}

export function getCloudinaryPublicBaseUrl() {
  return env.cloudinaryCloudName
    ? `https://res.cloudinary.com/${env.cloudinaryCloudName}`
    : "";
}
