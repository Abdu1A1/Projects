"use client";

import { useMemo } from "react";
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { currency } from "@/lib/utils";
import type { ReceiptRecord } from "@/types/receipt";

const palette = ["#0284c7", "#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd"];

export function DashboardView({ receipts, summary }: { receipts: ReceiptRecord[]; summary: string }) {
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = receipts.filter((receipt) => {
      if (!receipt.date) return false;
      const date = new Date(`${receipt.date}T00:00:00`);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });

    const thisWeek = receipts.filter((receipt) => {
      if (!receipt.date) return false;
      const date = new Date(`${receipt.date}T00:00:00`);
      const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    });

    const monthlyTotal = thisMonth.reduce((sum, receipt) => sum + (receipt.total ?? 0), 0);
    const highest = Math.max(0, ...receipts.map((receipt) => receipt.total ?? 0));

    const categoryMap = new Map<string, number>();
    thisMonth.forEach((receipt) => {
      const category = receipt.category ?? "Other";
      categoryMap.set(category, (categoryMap.get(category) ?? 0) + (receipt.total ?? 0));
    });

    const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
    const topCategory = categoryData.sort((a, b) => b.value - a.value)[0]?.name ?? "None";

    const dailyMap = new Map<string, number>();
    receipts.forEach((receipt) => {
      if (!receipt.date) return;
      const date = new Date(`${receipt.date}T00:00:00`);
      const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 30) {
        dailyMap.set(receipt.date, (dailyMap.get(receipt.date) ?? 0) + (receipt.total ?? 0));
      }
    });

    const dailyData = Array.from(dailyMap.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const merchantMap = new Map<string, number>();
    receipts.forEach((receipt) => {
      if (!receipt.merchant) return;
      merchantMap.set(receipt.merchant, (merchantMap.get(receipt.merchant) ?? 0) + (receipt.total ?? 0));
    });

    const merchantData = Array.from(merchantMap.entries())
      .map(([merchant, total]) => ({ merchant, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      monthlyTotal,
      topCategory,
      highest,
      weekCount: thisWeek.length,
      categoryData,
      dailyData,
      merchantData,
    };
  }, [receipts]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI monthly summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{summary}</p>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total spent this month" value={currency(stats.monthlyTotal)} />
        <StatCard title="Top spending category" value={stats.topCategory} />
        <StatCard title="Highest single receipt" value={currency(stats.highest)} />
        <StatCard title="Receipts this week" value={String(stats.weekCount)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Spending by category</CardTitle>
            <CardDescription>Current month</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.categoryData} dataKey="value" nameKey="name" outerRadius={95}>
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={entry.name} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily spending</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.dailyData}>
                <XAxis dataKey="date" hide />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#0284c7" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 merchants</CardTitle>
            <CardDescription>By total spend</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.merchantData} layout="vertical">
                <XAxis type="number" />
                <YAxis dataKey="merchant" type="category" width={85} />
                <Tooltip />
                <Bar dataKey="total" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle>{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
