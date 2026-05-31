'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardStats } from '@/lib/receipts/stats';
import { CATEGORY_COLORS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

const PALETTE = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#06b6d4',
  '#84cc16',
  '#a855f7',
  '#64748b',
  '#6366f1',
  '#94a3b8',
];

export function DashboardCharts({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Spending by category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.byCategory}
                  dataKey="total"
                  nameKey="category"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {stats.byCategory.map((entry, i) => (
                    <Cell key={entry.category} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value), stats.currency)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Daily spending (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.byDay} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => d.slice(5)}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value), stats.currency)}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Top 5 merchants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.topMerchants}
                layout="vertical"
                margin={{ left: 24, right: 16 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis type="category" dataKey="merchant" width={140} className="text-xs" />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value), stats.currency)}
                />
                <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
