import { NextResponse } from "next/server";

import { createMonthlySummary } from "@/lib/ai/monthly-summary";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: receipts, error } = await supabase
    .from("receipts")
    .select("merchant,total,category")
    .eq("user_id", user.id)
    .gte("date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = receipts ?? [];
  const totalSpent = list.reduce((sum, receipt) => sum + (receipt.total ?? 0), 0);

  const categoryMap = new Map<string, number>();
  const merchantMap = new Map<string, number>();
  list.forEach((receipt) => {
    categoryMap.set(receipt.category ?? "Other", (categoryMap.get(receipt.category ?? "Other") ?? 0) + (receipt.total ?? 0));
    merchantMap.set(receipt.merchant ?? "Unknown", (merchantMap.get(receipt.merchant ?? "Unknown") ?? 0) + (receipt.total ?? 0));
  });

  const topCategory = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Other";
  const topMerchant = Array.from(merchantMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Unknown";

  const summary = await createMonthlySummary({
    totalSpent,
    receiptCount: list.length,
    topCategory,
    topMerchant,
    categoryBreakdown: Array.from(categoryMap.entries()).map(([category, total]) => ({ category, total })),
  });

  return NextResponse.json({ summary });
}
