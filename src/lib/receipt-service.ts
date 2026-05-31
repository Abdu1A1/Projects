import { addDays, endOfMonth, format, isWithinInterval, startOfMonth, subDays } from "date-fns";
import { redirect } from "next/navigation";

import { buildFallbackMonthlySummary, summarizeMonthlySpending } from "@/lib/anthropic";
import { CATEGORY_OPTIONS } from "@/lib/constants";
import { hasRequiredSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CategoryRecord, Receipt, ReceiptFilters } from "@/lib/types";

function getSupabase() {
  if (!hasRequiredSupabaseEnv()) {
    return null;
  }
  return createSupabaseServerClient();
}

export async function getSessionUser() {
  const supabase = getSupabase();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function ensureUserProfile(userId: string, email: string | undefined) {
  const supabase = getSupabase();
  if (!supabase) {
    return;
  }

  await supabase.from("users").upsert({
    id: userId,
    email: email ?? null,
  });
}

export async function getCustomCategories(userId: string) {
  const supabase = getSupabase();
  if (!supabase) {
    return CATEGORY_OPTIONS.map((name, index) => ({
      id: `seed-${index}`,
      user_id: userId,
      name,
      is_custom: false,
    })) satisfies CategoryRecord[];
  }

  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  const defaults = CATEGORY_OPTIONS.map((name, index) => ({
    id: `default-${index}`,
    user_id: userId,
    name,
    is_custom: false,
  })) satisfies CategoryRecord[];

  const merged = new Map<string, CategoryRecord>();
  defaults.forEach((category) => merged.set(category.name.toLowerCase(), category));
  (data ?? []).forEach((category) => merged.set(category.name.toLowerCase(), category as CategoryRecord));

  return Array.from(merged.values());
}

export async function getCategoryCorrections(userId: string) {
  const supabase = getSupabase();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("receipt_corrections")
    .select("merchant, raw_excerpt, corrected_category")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  return (data ?? []).map((item) => ({
    merchant: item.merchant as string | null,
    excerpt: item.raw_excerpt as string | null,
    correctedCategory: item.corrected_category as string,
  }));
}

export async function getReceipts(userId: string, filters: ReceiptFilters = {}) {
  const supabase = getSupabase();
  if (!supabase) {
    return [] as Receipt[];
  }

  let query = supabase
    .from("receipts")
    .select("*, line_items(*), tags(*)")
    .eq("user_id", userId);

  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.startDate) {
    query = query.gte("date", filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte("date", filters.endDate);
  }
  if (typeof filters.minAmount === "number") {
    query = query.gte("total", filters.minAmount);
  }
  if (typeof filters.maxAmount === "number") {
    query = query.lte("total", filters.maxAmount);
  }
  if (filters.flag) {
    query = query.contains("flags", [filters.flag]);
  }
  if (filters.query) {
    query = query.textSearch("search_vector", filters.query, {
      config: "english",
      type: "websearch",
    });
  }

  const sortColumn =
    filters.sort === "merchant"
      ? "merchant"
      : filters.sort === "total"
        ? "total"
        : filters.sort === "category"
          ? "category"
          : "date";

  const { data, error } = await query.order(sortColumn, {
    ascending: filters.order === "asc",
    nullsFirst: false,
  });

  if (error) {
    throw error;
  }

  return (data ?? []) as Receipt[];
}

export async function getReceiptById(userId: string, receiptId: string) {
  const supabase = getSupabase();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("receipts")
    .select("*, line_items(*), tags(*)")
    .eq("user_id", userId)
    .eq("id", receiptId)
    .single();

  return (data ?? null) as Receipt | null;
}

export async function findPossibleDuplicate(userId: string, receipt: Receipt) {
  if (!receipt.merchant || receipt.total === null || !receipt.date) {
    return null;
  }

  const supabase = getSupabase();
  if (!supabase) {
    return null;
  }

  const start = new Date(`${receipt.date}T00:00:00`);
  const lower = new Date(start.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const upper = new Date(start.getTime() + 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("receipts")
    .select("id, merchant, total, date, image_url, category")
    .eq("user_id", userId)
    .eq("merchant", receipt.merchant)
    .eq("total", receipt.total)
    .neq("id", receipt.id)
    .gte("created_at", lower)
    .lte("created_at", upper)
    .limit(1)
    .maybeSingle();

  return data;
}

export async function getDashboardData(userId: string) {
  const receipts = await getReceipts(userId, {});
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const lastThirtyDaysStart = subDays(now, 29);
  const weekStart = subDays(now, 6);

  const monthReceipts = receipts.filter((receipt) => {
    if (!receipt.date) {
      return false;
    }
    const value = new Date(`${receipt.date}T00:00:00`);
    return isWithinInterval(value, { start: currentMonthStart, end: currentMonthEnd });
  });

  const weeklyReceipts = receipts.filter((receipt) => {
    if (!receipt.date) {
      return false;
    }
    const value = new Date(`${receipt.date}T00:00:00`);
    return isWithinInterval(value, { start: weekStart, end: now });
  });

  const totalSpentThisMonth = monthReceipts.reduce((sum, receipt) => sum + (receipt.total ?? 0), 0);
  const highestReceipt = monthReceipts.reduce((highest, receipt) => {
    if ((receipt.total ?? 0) > (highest.total ?? 0)) {
      return receipt;
    }
    return highest;
  }, monthReceipts[0] ?? null);

  const categoryTotals = monthReceipts.reduce<Record<string, number>>((acc, receipt) => {
    const key = receipt.category || "Other";
    acc[key] = (acc[key] ?? 0) + (receipt.total ?? 0);
    return acc;
  }, {});

  const merchantTotals = monthReceipts.reduce<Record<string, number>>((acc, receipt) => {
    const key = receipt.merchant || "Unknown";
    acc[key] = (acc[key] ?? 0) + (receipt.total ?? 0);
    return acc;
  }, {});

  const topCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] ?? [
    "Other",
    0,
  ];
  const topMerchantEntry = Object.entries(merchantTotals).sort((a, b) => b[1] - a[1])[0] ?? [
    "No merchant yet",
    0,
  ];

  const donutData = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const lineData = Array.from({ length: 30 }).map((_, index) => {
    const day = addDays(lastThirtyDaysStart, index);
    const dayKey = format(day, "yyyy-MM-dd");
    const total = receipts
      .filter((receipt) => receipt.date === dayKey)
      .reduce((sum, receipt) => sum + (receipt.total ?? 0), 0);

    return {
      date: format(day, "MMM d"),
      total,
    };
  });

  const barData = Object.entries(merchantTotals)
    .map(([merchant, total]) => ({ merchant, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const summaryPayload = {
    totalSpent: totalSpentThisMonth,
    receiptCount: monthReceipts.length,
    topCategory: topCategoryEntry[0],
    topCategoryTotal: topCategoryEntry[1],
    topMerchant: topMerchantEntry[0],
    topMerchants: barData,
    dailySpending: lineData,
  };

  const aiSummary =
    (await summarizeMonthlySpending(summaryPayload)) ??
    buildFallbackMonthlySummary({
      totalSpent: totalSpentThisMonth,
      receiptCount: monthReceipts.length,
      topCategory: topCategoryEntry[0],
      topCategoryTotal: topCategoryEntry[1],
      topMerchant: topMerchantEntry[0],
    });

  return {
    receipts,
    stats: {
      totalSpentThisMonth,
      topCategory: topCategoryEntry[0],
      highestReceipt: highestReceipt?.total ?? 0,
      receiptsThisWeek: weeklyReceipts.length,
    },
    charts: {
      donutData,
      lineData,
      barData,
    },
    aiSummary,
  };
}

export async function addCustomCategory(userId: string, name: string) {
  const supabase = getSupabase();
  if (!supabase) {
    return;
  }

  await supabase.from("categories").insert({
    user_id: userId,
    name,
    is_custom: true,
  });
}
