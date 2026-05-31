import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_FIELDS = [
  "merchant",
  "date",
  "time",
  "total",
  "tax",
  "currency",
  "payment_method",
  "category",
  "summary",
  "confidence",
] as const;

export async function PATCH(
  request: Request,
  context: { params: { id: string } },
) {
  const receiptId = context.params.id;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();

  const { data: existing } = await supabase
    .from("receipts")
    .select("id, category, merchant")
    .eq("id", receiptId)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  if (payload.addTag) {
    const { error } = await supabase.from("tags").insert({
      receipt_id: receiptId,
      label: String(payload.addTag),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  if (payload.removeTag) {
    const { error } = await supabase
      .from("tags")
      .delete()
      .eq("receipt_id", receiptId)
      .eq("label", String(payload.removeTag));

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  const updates: Record<string, unknown> = {};

  ALLOWED_FIELDS.forEach((field) => {
    if (field in payload) {
      updates[field] = payload[field];
    }
  });

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  const { error } = await supabase
    .from("receipts")
    .update(updates)
    .eq("id", receiptId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (typeof payload.category === "string" && payload.category !== existing.category) {
    await supabase.from("category_corrections").insert({
      user_id: user.id,
      merchant: existing.merchant,
      previous_category: existing.category,
      corrected_category: payload.category,
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: { id: string } },
) {
  const receiptId = context.params.id;
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("receipts")
    .delete()
    .eq("id", receiptId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
