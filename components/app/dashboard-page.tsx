"use client";

import { useMemo } from "react";
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, Receipt, Sparkles, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { ReceiptUploader } from "@/components/app/receipt-uploader";
import { ReceiptCard } from "@/components/app/receipt-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { DashboardStats, MonthlySummary, Receipt as ReceiptType } from "@/lib/types";

const chartColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
const tooltipCurrency = (value?: string | number | readonly (string | number)[]) =>
  formatCurrency(Number(Array.isArray(value) ? value[0] : value ?? 0));

export function DashboardPage({ receipts, stats, monthlySummary }: { receipts: ReceiptType[]; stats: DashboardStats; monthlySummary: MonthlySummary }) {
  const recentReceipts = useMemo(() => receipts.slice(0, 4), [receipts]);

  return (
    <div className="space-y-8 pb-28 md:pb-8">
      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.95fr]">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
          <CardHeader>
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              AI monthly summary
            </div>
            <CardTitle className="text-3xl">{monthlySummary.monthLabel}</CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7 text-foreground/80">{monthlySummary.text}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link className="inline-flex items-center gap-2" href="/library">
                  Open receipt library
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link className="inline-flex items-center gap-2" href="#upload">
                  Capture receipt
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Total spent this month", value: formatCurrency(stats.totalSpentThisMonth), icon: Wallet },
            { label: "Top category", value: stats.topCategory, icon: TrendingUp },
            { label: "Highest single receipt", value: formatCurrency(stats.highestReceipt), icon: Receipt },
            { label: "Receipts this week", value: `${stats.receiptsThisWeek}`, icon: Sparkles },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight">{item.value}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section id="upload">
        <ReceiptUploader />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Spending by category</CardTitle>
            <CardDescription>Donut chart for this month&apos;s category mix.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.donutData} dataKey="value" innerRadius={70} outerRadius={100} paddingAngle={4}>
                  {stats.donutData.map((entry, index) => (
                    <Cell fill={chartColors[index % chartColors.length]} key={entry.name} />
                  ))}
                </Pie>
                <Tooltip formatter={tooltipCurrency} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily spend</CardTitle>
            <CardDescription>Last 30 days of receipt totals.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.lineData}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} interval={4} />
                <YAxis tickFormatter={(value) => `${value}`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={tooltipCurrency} />
                <Line dataKey="total" stroke="hsl(var(--chart-1))" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top merchants</CardTitle>
            <CardDescription>Top 5 merchants by total spent.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.merchantData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="merchant" tick={{ fontSize: 12 }} type="category" width={90} />
                <Tooltip formatter={tooltipCurrency} />
                <Bar dataKey="total" fill="hsl(var(--chart-2))" radius={[8, 8, 8, 8]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Recent receipts</h2>
            <p className="text-sm text-muted-foreground">Jump back into your newest uploads and review low-confidence extractions fast.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/library">View all</Link>
          </Button>
        </div>
        <div className="grid receipt-grid gap-4">
          {recentReceipts.map((receipt) => (
            <ReceiptCard key={receipt.id} receipt={receipt} />
          ))}
        </div>
      </section>
    </div>
  );
}
