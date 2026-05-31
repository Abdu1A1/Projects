import Link from "next/link";
import { Download, ReceiptText, TrendingUp, Trophy, Wallet } from "lucide-react";

import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { SetupNotice } from "@/components/setup-notice";
import { ReceiptUploader } from "@/components/upload/receipt-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData, requireUser } from "@/lib/receipt-service";
import { compactNumber, formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const dashboard = await getDashboardData(user.id);

  const stats = [
    {
      label: "Total spent this month",
      value: formatCurrency(dashboard.stats.totalSpentThisMonth),
      icon: Wallet,
    },
    {
      label: "Top spending category",
      value: dashboard.stats.topCategory,
      icon: Trophy,
    },
    {
      label: "Highest single receipt",
      value: formatCurrency(dashboard.stats.highestReceipt),
      icon: TrendingUp,
    },
    {
      label: "Receipts this week",
      value: compactNumber(dashboard.stats.receiptsThisWeek),
      icon: ReceiptText,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
          <CardHeader className="space-y-3">
            <Badge variant="accent" className="w-fit">
              Monthly AI summary
            </Badge>
            <CardTitle className="text-3xl tracking-tight">Your receipt command center</CardTitle>
            <CardDescription className="max-w-2xl text-base">
              {dashboard.aiSummary}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/library">Open library</Link>
            </Button>
            <Button asChild variant="outline">
              <a href="/api/export/csv">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </a>
            </Button>
          </CardContent>
        </Card>

        <ReceiptUploader embedded />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <DashboardCharts
        donutData={dashboard.charts.donutData}
        lineData={dashboard.charts.lineData}
        barData={dashboard.charts.barData}
      />

      <SetupNotice />
    </div>
  );
}
