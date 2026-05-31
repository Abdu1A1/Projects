import { format } from "date-fns";
import { NextResponse } from "next/server";
import { generateMonthlySummary } from "@/lib/ai";
import { buildDashboardMetrics } from "@/lib/receipts";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const metrics = buildDashboardMetrics(data ?? []);

  const topMerchant = metrics.topMerchants[0]?.merchant ?? "N/A";
  const summary = await generateMonthlySummary({
    month: format(new Date(), "MMMM yyyy"),
    total: metrics.totalSpentThisMonth,
    receiptCount: (data ?? []).length,
    topCategory: metrics.topCategory,
    topMerchant,
  });

  return NextResponse.json({ summary });
}
