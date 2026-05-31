import { addDays, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subDays } from "date-fns";
import type { DashboardMetrics, LineItem, Receipt, ReceiptTag } from "@/lib/types";

export type ReceiptFilters = {
  search?: string;
  category?: string;
  minAmount?: string;
  maxAmount?: string;
  flag?: string;
  from?: string;
  to?: string;
  sort?: string;
};

export function applyReceiptSorting(
  query: any,
  sort: string | undefined,
): any {
  switch (sort) {
    case "date_asc":
      return query.order("date", { ascending: true, nullsFirst: false });
    case "total_desc":
      return query.order("total", { ascending: false, nullsFirst: false });
    case "total_asc":
      return query.order("total", { ascending: true, nullsFirst: false });
    case "merchant_asc":
      return query.order("merchant", { ascending: true, nullsFirst: false });
    case "category_asc":
      return query.order("category", { ascending: true, nullsFirst: false });
    case "date_desc":
    default:
      return query.order("date", { ascending: false, nullsFirst: false });
  }
}

export async function getReceiptsWithFilters(params: {
  supabase: any;
  userId: string;
  filters: ReceiptFilters;
}) {
  let query = params.supabase
    .from("receipts")
    .select("*")
    .eq("user_id", params.userId);

  if (params.filters.search) {
    query = query.textSearch("search_vector", params.filters.search, {
      type: "websearch",
      config: "english",
    });
  }

  if (params.filters.category) {
    query = query.eq("category", params.filters.category);
  }

  if (params.filters.minAmount) {
    query = query.gte("total", Number(params.filters.minAmount));
  }

  if (params.filters.maxAmount) {
    query = query.lte("total", Number(params.filters.maxAmount));
  }

  if (params.filters.flag) {
    query = query.contains("flags", [params.filters.flag]);
  }

  if (params.filters.from) {
    query = query.gte("date", params.filters.from);
  }

  if (params.filters.to) {
    query = query.lte("date", params.filters.to);
  }

  query = applyReceiptSorting(query, params.filters.sort);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []) as Receipt[];
}

export async function getReceiptDetail(params: {
  supabase: any;
  userId: string;
  receiptId: string;
}) {
  const { data: receipt, error: receiptError } = await params.supabase
    .from("receipts")
    .select("*")
    .eq("id", params.receiptId)
    .eq("user_id", params.userId)
    .single();

  if (receiptError) {
    throw receiptError;
  }

  const [lineItemsResult, tagsResult] = await Promise.all([
    params.supabase
      .from("line_items")
      .select("*")
      .eq("receipt_id", params.receiptId)
      .order("name", { ascending: true }),
    params.supabase
      .from("tags")
      .select("*")
      .eq("receipt_id", params.receiptId)
      .order("label", { ascending: true }),
  ]);

  if (lineItemsResult.error) throw lineItemsResult.error;
  if (tagsResult.error) throw tagsResult.error;

  let duplicate: Receipt | null = null;

  if (receipt?.merchant && receipt?.total !== null && receipt?.date) {
    const start = new Date(`${receipt.date}T00:00:00.000Z`);
    const end = addDays(start, 1);

    const { data: duplicateData } = await params.supabase
      .from("receipts")
      .select("*")
      .eq("user_id", params.userId)
      .eq("merchant", receipt.merchant)
      .eq("total", receipt.total)
      .gte("date", start.toISOString().slice(0, 10))
      .lte("date", end.toISOString().slice(0, 10))
      .neq("id", params.receiptId)
      .limit(1)
      .maybeSingle();

    duplicate = duplicateData;
  }

  return {
    receipt: receipt as Receipt,
    lineItems: (lineItemsResult.data ?? []) as LineItem[],
    tags: (tagsResult.data ?? []) as ReceiptTag[],
    duplicate,
  };
}

export function buildDashboardMetrics(receipts: Receipt[]): DashboardMetrics {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const thirtyDaysAgo = subDays(today, 29);

  const inMonth = receipts.filter((receipt) => {
    if (!receipt.date || receipt.total === null) return false;
    const date = new Date(`${receipt.date}T00:00:00.000Z`);
    return date >= monthStart && date <= monthEnd;
  });

  const inWeek = receipts.filter((receipt) => {
    if (!receipt.date) return false;
    const date = new Date(`${receipt.date}T00:00:00.000Z`);
    return date >= weekStart && date <= weekEnd;
  });

  const lastThirtyDays = receipts.filter((receipt) => {
    if (!receipt.date) return false;
    const date = new Date(`${receipt.date}T00:00:00.000Z`);
    return date >= thirtyDaysAgo && date <= today;
  });

  const totalSpentThisMonth = inMonth.reduce(
    (sum, receipt) => sum + (receipt.total ?? 0),
    0,
  );

  const highestReceipt = Math.max(0, ...inMonth.map((receipt) => receipt.total ?? 0));

  const categoryMap = new Map<string, number>();
  inMonth.forEach((receipt) => {
    const key = receipt.category || "Other";
    categoryMap.set(key, (categoryMap.get(key) ?? 0) + (receipt.total ?? 0));
  });

  const merchantMap = new Map<string, number>();
  inMonth.forEach((receipt) => {
    const key = receipt.merchant || "Unknown";
    merchantMap.set(key, (merchantMap.get(key) ?? 0) + (receipt.total ?? 0));
  });

  const topCategory =
    Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "None";

  const spendByCategory = Array.from(categoryMap.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const topMerchants = Array.from(merchantMap.entries())
    .map(([merchant, total]) => ({ merchant, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const dailyMap = new Map<string, number>();
  lastThirtyDays.forEach((receipt) => {
    if (!receipt.date) return;
    dailyMap.set(receipt.date, (dailyMap.get(receipt.date) ?? 0) + (receipt.total ?? 0));
  });

  const dailySpend = Array.from({ length: 30 }).map((_, index) => {
    const date = subDays(today, 29 - index);
    const key = format(date, "yyyy-MM-dd");
    return {
      date: format(date, "MMM d"),
      total: dailyMap.get(key) ?? 0,
    };
  });

  return {
    totalSpentThisMonth,
    topCategory,
    highestReceipt,
    receiptsThisWeek: inWeek.length,
    spendByCategory,
    dailySpend,
    topMerchants,
  };
}

export function groupReceiptsByTime(receipts: Receipt[]) {
  const grouped: Record<string, Record<string, Record<string, Receipt[]>>> = {};

  receipts.forEach((receipt) => {
    const date = receipt.date ? new Date(`${receipt.date}T00:00:00.000Z`) : new Date();
    const year = String(date.getFullYear());
    const month = format(date, "MMMM");
    const category = receipt.category || "Other";

    grouped[year] ??= {};
    grouped[year][month] ??= {};
    grouped[year][month][category] ??= [];
    grouped[year][month][category].push(receipt);
  });

  return grouped;
}

export function groupReceiptsByMerchant(receipts: Receipt[]) {
  const grouped = new Map<string, Receipt[]>();

  receipts.forEach((receipt) => {
    const merchant = receipt.merchant || "Unknown merchant";
    const list = grouped.get(merchant) ?? [];
    list.push(receipt);
    grouped.set(merchant, list);
  });

  return Array.from(grouped.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
}
