import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const receiptId = params.id;
    const body = (await request.json()) as {
      fields?: Record<string, unknown>;
      line_items?: Array<{ id?: string; name: string; qty: number | null; price: number | null }>;
      tags?: Array<{ id?: string; label: string }>;
    };

    const { data: existingReceipt } = await supabase
      .from("receipts")
      .select("id, user_id, merchant, raw_text, category")
      .eq("user_id", user.id)
      .eq("id", receiptId)
      .single();

    if (!existingReceipt) {
      return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
    }

    if (body.fields && Object.keys(body.fields).length) {
      const { error } = await supabase
        .from("receipts")
        .update(body.fields)
        .eq("id", receiptId)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      if (
        typeof body.fields.category === "string" &&
        body.fields.category !== existingReceipt.category
      ) {
        await supabase.from("receipt_corrections").insert({
          user_id: user.id,
          receipt_id: receiptId,
          merchant: existingReceipt.merchant,
          raw_excerpt:
            typeof existingReceipt.raw_text === "string"
              ? existingReceipt.raw_text.slice(0, 500)
              : null,
          previous_category: existingReceipt.category,
          corrected_category: body.fields.category,
        });
      }
    }

    if (body.line_items) {
      await supabase.from("line_items").delete().eq("receipt_id", receiptId);
      const filtered = body.line_items.filter((item) => item.name.trim());
      if (filtered.length) {
        const { error } = await supabase.from("line_items").insert(
          filtered.map((item) => ({
            receipt_id: receiptId,
            name: item.name,
            qty: item.qty,
            price: item.price,
          })),
        );
        if (error) {
          throw error;
        }
      }
    }

    if (body.tags) {
      await supabase.from("tags").delete().eq("receipt_id", receiptId);
      const filteredTags = body.tags.filter((tag) => tag.label.trim());
      if (filteredTags.length) {
        const { error } = await supabase.from("tags").insert(
          filteredTags.map((tag) => ({
            receipt_id: receiptId,
            label: tag.label.trim(),
          })),
        );
        if (error) {
          throw error;
        }
      }
    }

    revalidatePath("/library");
    revalidatePath(`/receipts/${receiptId}`);
    revalidatePath("/dashboard");
    revalidatePath("/archive");

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update receipt." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("receipts")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    revalidatePath("/library");
    revalidatePath("/dashboard");
    revalidatePath("/archive");

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete receipt." },
      { status: 500 },
    );
  }
}
