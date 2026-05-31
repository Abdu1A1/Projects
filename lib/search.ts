import { endOfMonth, format, startOfMonth } from "date-fns";
import type { ReceiptFilters } from "@/lib/types";

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export function normalizeFilters(searchParams: Record<string, string | string[] | undefined>): ReceiptFilters {
  const value = (key: string) => {
    const raw = searchParams[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };

  const query = value("query")?.trim();
  const amountMin = value("minAmount");
  const amountMax = value("maxAmount");

  return {
    query,
    category: value("category") || undefined,
    flag: value("flag") || undefined,
    dateFrom: value("dateFrom") || undefined,
    dateTo: value("dateTo") || undefined,
    minAmount: amountMin ? Number(amountMin) : undefined,
    maxAmount: amountMax ? Number(amountMax) : undefined,
    sort: (value("sort") as ReceiptFilters["sort"]) || "date",
    direction: (value("direction") as ReceiptFilters["direction"]) || "desc",
    view: (value("view") as ReceiptFilters["view"]) || "grid",
  };
}

export function extractQueryHints(query?: string) {
  if (!query) {
    return { textQuery: "", parsed: {} as Partial<ReceiptFilters> };
  }

  let textQuery = query;
  const parsed: Partial<ReceiptFilters> = {};

  const overMatch = query.match(/over\s*\$?(\d+(?:\.\d+)?)/i);
  if (overMatch) {
    parsed.minAmount = Number(overMatch[1]);
    textQuery = textQuery.replace(overMatch[0], " ");
  }

  const underMatch = query.match(/under\s*\$?(\d+(?:\.\d+)?)/i);
  if (underMatch) {
    parsed.maxAmount = Number(underMatch[1]);
    textQuery = textQuery.replace(underMatch[0], " ");
  }

  const monthMatch = MONTHS.find((month) => query.toLowerCase().includes(month));
  if (monthMatch) {
    const monthIndex = MONTHS.indexOf(monthMatch);
    const base = new Date();
    const monthDate = new Date(base.getFullYear(), monthIndex, 1);
    parsed.dateFrom = format(startOfMonth(monthDate), "yyyy-MM-dd");
    parsed.dateTo = format(endOfMonth(monthDate), "yyyy-MM-dd");
    textQuery = textQuery.replace(new RegExp(monthMatch, "i"), " ");
  }

  return {
    textQuery: textQuery.replace(/\s+/g, " ").trim(),
    parsed,
  };
}
