import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { extractReceiptFromImage } from "@/lib/anthropic";
import { uploadReceiptAsset } from "@/lib/cloudinary";
import { createProcessedReceipt, getCorrections } from "@/lib/data/repository";
import { fallbackExtraction } from "@/lib/prompts";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing upload file." }, { status: 400 });
    }

    const upload = await uploadReceiptAsset(file, user.id);
    const corrections = await getCorrections(user.id);

    let extraction = fallbackExtraction(file.name);
    let rawResponse: string | null = null;

    try {
      const result = await extractReceiptFromImage({
        fileName: file.name,
        imageUrl: upload.aiUrl,
        fewShotCorrections: corrections,
      });
      extraction = result.extraction;
      rawResponse = result.rawResponse;
    } catch {
      extraction = fallbackExtraction(file.name);
      rawResponse = null;
    }

    const receipt = await createProcessedReceipt({
      userId: user.id,
      imageUrl: upload.imageUrl,
      rawText: rawResponse,
      extraction,
    });

    return NextResponse.json({ receipt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process receipt.";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
