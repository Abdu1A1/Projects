import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { ReceiptRecord } from "@/types/receipt";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: current } = await supabase
    .from("receipts")
    .select("id,merchant,total,date")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!current || !current.merchant || current.total === null || !current.date) {
    return NextResponse.json({ duplicate: null });
  }

  const from = new Date(`${current.date}T00:00:00.000Z`);
  const to = new Date(from);
  from.setHours(from.getHours() - 24);
  to.setHours(to.getHours() + 24);

  const { data: duplicate } = await supabase
    .from("receipts")
    .select("id,user_id,image_url,raw_text,merchant,date,time,total,tax,currency,payment_method,category,summary,flags,confidence,created_at")
    .eq("user_id", user.id)
    .neq("id", params.id)
    .ilike("merchant", current.merchant)
    .eq("total", current.total)
    .gte("date", from.toISOString().slice(0, 10))
    .lte("date", to.toISOString().slice(0, 10))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ duplicate: (duplicate ?? null) as ReceiptRecord | null });
}
