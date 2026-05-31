import { format } from "date-fns";
import { generateMonthlySummary } from "@/lib/ai";
import { buildDashboardMetrics } from "@/lib/receipts";
import { createClient } from "@/lib/supabase/server";
import { currency } from "@/lib/utils";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: receipts } = await supabase
    .from("receipts")
    .select("*")
    .eq("user_id", user!.id)
    .order("date", { ascending: false });

  const metrics = buildDashboardMetrics(receipts ?? []);
  const topMerchant = metrics.topMerchants[0]?.merchant ?? "N/A";

  const aiSummary = await generateMonthlySummary({
    month: format(new Date(), "MMMM yyyy"),
    total: metrics.totalSpentThisMonth,
    receiptCount: (receipts ?? []).length,
    topCategory: metrics.topCategory,
    topMerchant,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">{aiSummary}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total spent this month</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {currency(metrics.totalSpentThisMonth)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top spending category</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{metrics.topCategory}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Highest single receipt</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {currency(metrics.highestReceipt)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Receipts this week</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {metrics.receiptsThisWeek}
          </CardContent>
        </Card>
      </div>

      <DashboardCharts metrics={metrics} />
    </div>
  );
}
