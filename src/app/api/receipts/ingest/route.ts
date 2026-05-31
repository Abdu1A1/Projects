import { NextResponse } from "next/server";

import { parseReceiptWithClaude } from "@/lib/ai/receipt-parser";
import { uploadReceiptFile } from "@/lib/cloudinary/upload";
import { detectDuplicate, insertReceiptWithRelations } from "@/lib/receipts";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  try {
    const uploaded = await uploadReceiptFile(file);

    const { data: corrections } = await supabase
      .from("user_corrections")
      .select("merchant,line_items_text,corrected_category")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const extraction = await parseReceiptWithClaude({
      imageUrl: uploaded.enhancedUrl,
      corrections: corrections ?? [],
    });

    const duplicate = await detectDuplicate(supabase, user.id, extraction.merchant, extraction.total, extraction.date);
    if (duplicate && !extraction.flags.includes("possible_duplicate")) {
      extraction.flags.push("possible_duplicate");
    }

    const receiptId = await insertReceiptWithRelations(supabase, {
      userId: user.id,
      imageUrl: uploaded.originalUrl,
      rawText: JSON.stringify(extraction),
      extraction,
    });

    return NextResponse.json({ id: receiptId });
  } catch (error) {
    const uploaded = file.size > 0 ? await uploadReceiptFile(file).catch(() => null) : null;

    const { data, error: insertError } = await supabase
      .from("receipts")
      .insert({
        user_id: user.id,
        image_url: uploaded?.originalUrl ?? null,
        raw_text: `Parsing failed: ${(error as Error).message}`,
        confidence: 0,
        flags: ["low_confidence", "missing_total"],
        summary: "Automatic parsing failed. Please review manually.",
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, warning: "Parsing failed; saved for manual review." }, { status: 202 });
  }
}
