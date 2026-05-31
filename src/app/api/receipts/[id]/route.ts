import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { toNumber } from "@/lib/utils";
import type { ReceiptRecord } from "@/types/receipt";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("receipts")
    .select("id,user_id,image_url,raw_text,merchant,date,time,total,tax,currency,payment_method,category,summary,flags,confidence,created_at")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });
  }

  const [{ data: lineItems }, { data: tags }] = await Promise.all([
    supabase.from("line_items").select("id,name,qty,price").eq("receipt_id", params.id),
    supabase.from("tags").select("id,label").eq("receipt_id", params.id),
  ]);

  return NextResponse.json({ receipt: { ...(data as ReceiptRecord), line_items: lineItems ?? [], tags: tags ?? [] } });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<ReceiptRecord>;

  const { data: current } = await supabase
    .from("receipts")
    .select("merchant,category")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const updatePayload = {
    merchant: body.merchant,
    date: body.date,
    time: body.time,
    total: toNumber(body.total),
    tax: toNumber(body.tax),
    payment_method: body.payment_method,
    category: body.category,
    summary: body.summary,
  };

  const { error: updateError } = await supabase
    .from("receipts")
    .update(updatePayload)
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (body.tags) {
    await supabase.from("tags").delete().eq("receipt_id", params.id);
    if (body.tags.length) {
      await supabase.from("tags").insert(
        body.tags.map((tag) => ({
          receipt_id: params.id,
          label: tag.label,
        })),
      );
    }
  }

  if (body.category && current && current.category !== body.category) {
    const { data: lineItems } = await supabase.from("line_items").select("name").eq("receipt_id", params.id);

    await supabase.from("user_corrections").insert({
      user_id: user.id,
      merchant: body.merchant ?? current.merchant,
      line_items_text: (lineItems ?? []).map((line) => line.name).join(", "),
      corrected_category: body.category,
    });
  }

  const { data: receiptData } = await supabase
    .from("receipts")
    .select("id,user_id,image_url,raw_text,merchant,date,time,total,tax,currency,payment_method,category,summary,flags,confidence,created_at")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  const [{ data: lineItems }, { data: tags }] = await Promise.all([
    supabase.from("line_items").select("id,name,qty,price").eq("receipt_id", params.id),
    supabase.from("tags").select("id,label").eq("receipt_id", params.id),
  ]);

  return NextResponse.json({
    receipt: {
      ...(receiptData as ReceiptRecord),
      line_items: lineItems ?? [],
      tags: tags ?? [],
    },
  });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("receipts").delete().eq("id", params.id).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
