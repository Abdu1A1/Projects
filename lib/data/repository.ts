import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { applyReceiptFilters, buildFolderGroups, computeDashboardStats, findDuplicateCandidate, normalizeExtraction, sortReceipts } from "@/lib/receipt-logic";
import { demoCategories, demoCorrections, demoReceipts } from "@/lib/mock-data";
import { extractQueryHints } from "@/lib/search";
import type { Category, DashboardStats, FolderGroup, Receipt, ReceiptExtraction, ReceiptFilters } from "@/lib/types";

function mapReceiptRow(row: any): Receipt {
  return {
    ...row,
    flags: row.flags || [],
    line_items: row.line_items || [],
    tags: row.tags || [],
    currency: row.currency || "CAD",
    confidence: row.confidence ?? 0,
  };
}

function cloneReceipt(receipt: Receipt): Receipt {
  return {
    ...receipt,
    line_items: receipt.line_items.map((item) => ({ ...item })),
    tags: receipt.tags.map((tag) => ({ ...tag })),
    flags: [...receipt.flags],
  };
}

export async function getCategories(userId: string): Promise<Category[]> {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return [...demoCategories];
  }

  const { data, error } = await supabase.from("categories").select("*").eq("user_id", userId).order("name", { ascending: true });
  if (error) throw error;

  const defaults = DEFAULT_CATEGORIES.map((name, index) => ({ id: `default-${index}`, user_id: userId, name, is_custom: false }));
  return [...defaults, ...(data || []).filter((category) => category.is_custom)];
}

export async function createCategory(userId: string, name: string) {
  const category = { id: crypto.randomUUID(), user_id: userId, name, is_custom: true };
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    demoCategories.push(category);
    return category;
  }

  const { data, error } = await supabase.from("categories").insert(category).select().single();
  if (error) throw error;
  return data;
}

export async function getReceipts(userId: string, filters: ReceiptFilters = {}): Promise<Receipt[]> {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return sortReceipts(applyReceiptFilters(demoReceipts.map(cloneReceipt), filters), filters);
  }

  const hints = extractQueryHints(filters.query);
  const mergedFilters: ReceiptFilters = {
    ...hints.parsed,
    ...filters,
    minAmount: filters.minAmount ?? hints.parsed.minAmount,
    maxAmount: filters.maxAmount ?? hints.parsed.maxAmount,
    dateFrom: filters.dateFrom ?? hints.parsed.dateFrom,
    dateTo: filters.dateTo ?? hints.parsed.dateTo,
  };

  let query = supabase.from("receipts").select("*, line_items(*), tags(*)").eq("user_id", userId);

  if (mergedFilters.category) query = query.eq("category", mergedFilters.category);
  if (mergedFilters.flag) query = query.contains("flags", [mergedFilters.flag]);
  if (mergedFilters.minAmount !== undefined) query = query.gte("total", mergedFilters.minAmount);
  if (mergedFilters.maxAmount !== undefined) query = query.lte("total", mergedFilters.maxAmount);
  if (mergedFilters.dateFrom) query = query.gte("date", mergedFilters.dateFrom);
  if (mergedFilters.dateTo) query = query.lte("date", mergedFilters.dateTo);
  if (hints.textQuery) query = query.textSearch("search_vector", hints.textQuery, { type: "websearch" });

  const sortColumn = mergedFilters.sort === "merchant" ? "merchant" : mergedFilters.sort === "category" ? "category" : mergedFilters.sort === "total" ? "total" : "date";
  query = query.order(sortColumn, { ascending: mergedFilters.direction === "asc", nullsFirst: false });

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(mapReceiptRow);
}

export async function getReceipt(userId: string, receiptId: string): Promise<Receipt | null> {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return demoReceipts.find((receipt) => receipt.id === receiptId && receipt.user_id === userId) || null;
  }

  const { data, error } = await supabase
    .from("receipts")
    .select("*, line_items(*), tags(*)")
    .eq("id", receiptId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return mapReceiptRow(data);
}

export async function getDuplicateReceipt(userId: string, receiptId: string) {
  const receipt = await getReceipt(userId, receiptId);
  if (!receipt) return null;
  const receipts = await getReceipts(userId, {});
  return findDuplicateCandidate(receipts, receipt);
}

export async function saveCategoryCorrection(args: {
  userId: string;
  merchant: string | null;
  originalCategory: string | null;
  correctedCategory: string;
}) {
  const supabase = getServerSupabaseClient();
  const correction = {
    id: crypto.randomUUID(),
    user_id: args.userId,
    merchant: args.merchant,
    original_category: args.originalCategory,
    corrected_category: args.correctedCategory,
    created_at: new Date().toISOString(),
  };

  if (!supabase) {
    demoCorrections.push(correction);
    return correction;
  }

  const { data, error } = await supabase.from("category_corrections").insert(correction).select().single();
  if (error) throw error;
  return data;
}

export async function getCorrections(userId: string) {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return demoCorrections.filter((correction) => correction.user_id === userId).slice(-5);
  }

  const { data, error } = await supabase
    .from("category_corrections")
    .select("merchant, original_category, corrected_category")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) throw error;
  return data || [];
}

export async function createProcessedReceipt(args: {
  userId: string;
  imageUrl: string;
  rawText: string | null;
  extraction: ReceiptExtraction;
}) {
  const supabase = getServerSupabaseClient();
  const normalized = normalizeExtraction(args.extraction);
  const baseReceipt = {
    id: crypto.randomUUID(),
    user_id: args.userId,
    image_url: args.imageUrl,
    raw_text: args.rawText,
    merchant: normalized.merchant,
    date: normalized.date,
    time: normalized.time,
    total: normalized.total,
    tax: normalized.tax,
    currency: normalized.currency || "CAD",
    payment_method: normalized.payment_method,
    category: normalized.category || "Other",
    summary: normalized.summary,
    flags: normalized.flags,
    confidence: normalized.confidence,
    created_at: new Date().toISOString(),
  };

  if (!supabase) {
    const receipt: Receipt = {
      ...baseReceipt,
      line_items: normalized.line_items.map((item) => ({ ...item, id: crypto.randomUUID() })),
      tags: [],
    };
    const duplicate = findDuplicateCandidate(demoReceipts, receipt);
    if (duplicate && !receipt.flags.includes("possible_duplicate")) {
      receipt.flags.push("possible_duplicate");
    }
    demoReceipts.unshift(receipt);
    return receipt;
  }

  const { data, error } = await supabase.from("receipts").insert(baseReceipt).select().single();
  if (error) throw error;

  if (normalized.line_items.length) {
    const items = normalized.line_items.map((item) => ({
      receipt_id: data.id,
      name: item.name,
      qty: item.qty,
      price: item.price,
    }));
    const { error: itemError } = await supabase.from("line_items").insert(items);
    if (itemError) throw itemError;
  }

  const duplicate = await getDuplicateReceipt(args.userId, data.id);
  if (duplicate && !normalized.flags.includes("possible_duplicate")) {
    const nextFlags = [...normalized.flags, "possible_duplicate"];
    await supabase.from("receipts").update({ flags: nextFlags }).eq("id", data.id).eq("user_id", args.userId);
  }

  const receipt = await getReceipt(args.userId, data.id);
  if (!receipt) {
    throw new Error("Unable to load created receipt.");
  }

  return receipt;
}

export async function updateReceipt(args: {
  userId: string;
  receiptId: string;
  patch: Record<string, unknown>;
}) {
  const supabase = getServerSupabaseClient();

  if (!supabase) {
    const index = demoReceipts.findIndex((receipt) => receipt.id === args.receiptId && receipt.user_id === args.userId);
    if (index === -1) return null;
    const current = demoReceipts[index];
    const updated: Receipt = {
      ...current,
      ...args.patch,
      line_items: (args.patch.line_items as Receipt["line_items"]) || current.line_items,
      tags:
        (args.patch.tags as string[] | undefined)?.map((label, itemIndex) => ({ id: `tag-${itemIndex}-${label}`, label })) ||
        current.tags,
    };
    demoReceipts[index] = updated;
    return updated;
  }

  const { tags, line_items, originalCategory, ...receiptPatch } = args.patch;
  void originalCategory;

  if (Object.keys(receiptPatch).length) {
    const { error } = await supabase.from("receipts").update(receiptPatch).eq("id", args.receiptId).eq("user_id", args.userId);
    if (error) throw error;
  }

  if (Array.isArray(tags)) {
    const { error: deleteError } = await supabase.from("tags").delete().eq("receipt_id", args.receiptId);
    if (deleteError) throw deleteError;
    if (tags.length) {
      const { error: insertError } = await supabase.from("tags").insert(tags.map((label) => ({ receipt_id: args.receiptId, label })));
      if (insertError) throw insertError;
    }
  }

  if (Array.isArray(line_items)) {
    const { error: deleteError } = await supabase.from("line_items").delete().eq("receipt_id", args.receiptId);
    if (deleteError) throw deleteError;
    if (line_items.length) {
      const { error: insertError } = await supabase.from("line_items").insert(
        line_items.map((item: any) => ({ receipt_id: args.receiptId, name: item.name, qty: item.qty, price: item.price })),
      );
      if (insertError) throw insertError;
    }
  }

  return getReceipt(args.userId, args.receiptId);
}

export async function deleteReceipt(userId: string, receiptId: string) {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    const next = demoReceipts.filter((receipt) => !(receipt.id === receiptId && receipt.user_id === userId));
    demoReceipts.length = 0;
    demoReceipts.push(...next);
    return;
  }

  const { error } = await supabase.from("receipts").delete().eq("id", receiptId).eq("user_id", userId);
  if (error) throw error;
}

export async function getDashboardData(userId: string): Promise<{
  receipts: Receipt[];
  stats: DashboardStats;
  monthlySummary: Awaited<ReturnType<typeof import("@/lib/anthropic").generateMonthlySummary>>;
}> {
  const receipts = await getReceipts(userId, { sort: "date", direction: "desc" });
  const stats = computeDashboardStats(receipts);
  const { generateMonthlySummary } = await import("@/lib/anthropic");
  const monthlySummary = await generateMonthlySummary(receipts);
  return { receipts, stats, monthlySummary };
}

export async function getFolderData(userId: string, filters: ReceiptFilters): Promise<FolderGroup[]> {
  const receipts = await getReceipts(userId, filters);
  return buildFolderGroups(receipts, filters.view);
}
