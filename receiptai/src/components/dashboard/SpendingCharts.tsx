'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { SpendingByCategory, DailySpending, MerchantSpending, CATEGORY_COLORS } from '@/types';
import { format, parseISO } from 'date-fns';

interface SpendingChartsProps {
  spendingByCategory: SpendingByCategory[];
  dailySpending: DailySpending[];
  topMerchants: MerchantSpending[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value);

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg text-sm">
        {label && <p className="font-medium text-gray-900 dark:text-white mb-1">{label}</p>}
        {payload.map((p, i) => (
          <p key={i} className="text-gray-600 dark:text-gray-300">
            {p.name && `${p.name}: `}{formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function SpendingCharts({ spendingByCategory, dailySpending, topMerchants }: SpendingChartsProps) {
  const chartData = spendingByCategory.map((item) => ({
    ...item,
    color: CATEGORY_COLORS[item.category] || '#94a3b8',
  }));

  const formattedDaily = dailySpending.map((d) => ({
    date: format(parseISO(d.date), 'MMM d'),
    total: d.total,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Donut Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Spending by Category</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                dataKey="total"
                nameKey="category"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-400">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
            No data for this month
          </div>
        )}
      </div>

      {/* Line Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Daily Spending (30 days)</h3>
        {formattedDaily.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={formattedDaily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:stroke-gray-800" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#6366f1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
            No spending data in the last 30 days
          </div>
        )}
      </div>

      {/* Bar Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 lg:col-span-2">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Merchants by Spend</h3>
        {topMerchants.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topMerchants} layout="vertical" barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <YAxis
                type="category"
                dataKey="merchant"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" fill="#6366f1" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
            No merchant data yet
          </div>
        )}
      </div>
    </div>
  );
}
