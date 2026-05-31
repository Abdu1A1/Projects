import { DashboardView } from "@/components/dashboard/dashboard-view";
import { requireUser } from "@/lib/auth";
import { createMonthlySummary } from "@/lib/ai/monthly-summary";
import { createClient } from "@/lib/supabase/server";
import type { ReceiptRecord } from "@/types/receipt";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = createClient();

  const { data: receiptsData } = await supabase
    .from("receipts")
    .select("id,user_id,image_url,raw_text,merchant,date,time,total,tax,currency,payment_method,category,summary,flags,confidence,created_at")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  const receipts = (receiptsData ?? []) as ReceiptRecord[];

  const categoryTotals = new Map<string, number>();
  const merchantTotals = new Map<string, number>();
  let totalSpent = 0;

  receipts.forEach((receipt) => {
    const total = receipt.total ?? 0;
    totalSpent += total;

    const category = receipt.category ?? "Other";
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + total);

    const merchant = receipt.merchant ?? "Unknown";
    merchantTotals.set(merchant, (merchantTotals.get(merchant) ?? 0) + total);
  });

  const topCategory = Array.from(categoryTotals.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Other";
  const topMerchant = Array.from(merchantTotals.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Unknown";

  const summary = receipts.length
    ? await createMonthlySummary({
        totalSpent,
        receiptCount: receipts.length,
        topCategory,
        topMerchant,
        categoryBreakdown: Array.from(categoryTotals.entries()).map(([category, total]) => ({ category, total })),
      })
    : "No receipt activity yet this month. Add receipts to unlock your monthly summary.";

  return <DashboardView receipts={receipts} summary={summary} />;
}
