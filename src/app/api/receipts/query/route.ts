import { NextResponse } from "next/server";

import { createMonthlySummary } from "@/lib/ai/monthly-summary";
import { createClient } from "@/lib/supabase/server";
import type { ReceiptRecord } from "@/types/receipt";

function parseFlags(flagsRaw: string | null) {
  if (!flagsRaw) return [] as string[];
  return flagsRaw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const category = searchParams.get("category");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const min = searchParams.get("min");
  const max = searchParams.get("max");
  const flags = parseFlags(searchParams.get("flags"));
  const sort = searchParams.get("sort") ?? "date";
  const order = searchParams.get("order") === "asc";

  let query = supabase
    .from("receipts")
    .select("id,user_id,image_url,raw_text,merchant,date,time,total,tax,currency,payment_method,category,summary,flags,confidence,created_at")
    .eq("user_id", user.id);

  if (q) {
    const overMatch = q.toLowerCase().match(/over\s*\$?(\d+(\.\d+)?)/);
    if (overMatch) {
      query = query.gte("total", Number(overMatch[1]));
    }
    query = query.textSearch("search_vector", q, { type: "websearch" });
  }

  if (category) query = query.eq("category", category);
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);
  if (min) query = query.gte("total", Number(min));
  if (max) query = query.lte("total", Number(max));
  if (flags.length) query = query.contains("flags", flags);

  query = query.order(sort, { ascending: order, nullsFirst: false }).limit(200);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const receipts = (data ?? []) as ReceiptRecord[];
  const totalSpent = receipts.reduce((sum, receipt) => sum + (receipt.total ?? 0), 0);

  const categoryMap = new Map<string, number>();
  const merchantMap = new Map<string, number>();
  receipts.forEach((receipt) => {
    const total = receipt.total ?? 0;
    const cat = receipt.category ?? "Other";
    const merchant = receipt.merchant ?? "Unknown";
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + total);
    merchantMap.set(merchant, (merchantMap.get(merchant) ?? 0) + total);
  });

  const topCategory = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Other";
  const topMerchant = Array.from(merchantMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Unknown";

  const monthlySummary = receipts.length
    ? await createMonthlySummary({
        totalSpent,
        receiptCount: receipts.length,
        topCategory,
        topMerchant,
        categoryBreakdown: Array.from(categoryMap.entries()).map(([categoryName, total]) => ({ category: categoryName, total })),
      })
    : "No receipts processed yet.";

  return NextResponse.json({ receipts, monthlySummary });
}

export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { action: string; name: string };

  if (body.action !== "create_custom_category" || !body.name) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: body.name,
    is_custom: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
