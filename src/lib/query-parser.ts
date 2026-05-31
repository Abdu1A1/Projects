import { endOfMonth, format, startOfMonth } from "date-fns";

import { CATEGORY_OPTIONS, MONTH_NAMES } from "@/lib/constants";
import type { ReceiptFilters } from "@/lib/types";

function extractAmountBounds(query: string) {
  const overMatch = query.match(/(?:over|above|more than|>=|>)\s*\$?(\d+(?:\.\d+)?)/i);
  const underMatch = query.match(/(?:under|below|less than|<=|<)\s*\$?(\d+(?:\.\d+)?)/i);

  return {
    minAmount: overMatch ? Number.parseFloat(overMatch[1]) : undefined,
    maxAmount: underMatch ? Number.parseFloat(underMatch[1]) : undefined,
  };
}

function extractMonthRange(query: string) {
  const index = MONTH_NAMES.findIndex((month) => query.toLowerCase().includes(month));
  if (index === -1) {
    return {};
  }

  const now = new Date();
  const year = now.getFullYear();
  const start = startOfMonth(new Date(year, index, 1));
  const end = endOfMonth(start);

  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  };
}

function extractCategory(query: string) {
  return CATEGORY_OPTIONS.find((category) =>
    query.toLowerCase().includes(category.toLowerCase()),
  );
}

export function parseSearchFilters(searchParams: Record<string, string | string[] | undefined>): ReceiptFilters {
  const queryParam = typeof searchParams.q === "string" ? searchParams.q : "";
  const minAmountParam = typeof searchParams.min === "string" ? Number.parseFloat(searchParams.min) : undefined;
  const maxAmountParam = typeof searchParams.max === "string" ? Number.parseFloat(searchParams.max) : undefined;
  const parsedAmountBounds = extractAmountBounds(queryParam);
  const parsedMonthRange = extractMonthRange(queryParam);

  const categoryParam = typeof searchParams.category === "string" ? searchParams.category : extractCategory(queryParam);

  const strippedQuery = queryParam
    .replace(/(?:over|above|more than|>=|>)\s*\$?\d+(?:\.\d+)?/gi, " ")
    .replace(/(?:under|below|less than|<=|<)\s*\$?\d+(?:\.\d+)?/gi, " ")
    .replace(new RegExp(MONTH_NAMES.join("|"), "gi"), " ")
    .trim()
    .replace(/\s+/g, " ");

  return {
    query: strippedQuery || undefined,
    category: categoryParam || undefined,
    startDate: typeof searchParams.start === "string" ? searchParams.start : parsedMonthRange.startDate,
    endDate: typeof searchParams.end === "string" ? searchParams.end : parsedMonthRange.endDate,
    minAmount: Number.isFinite(minAmountParam as number)
      ? minAmountParam
      : parsedAmountBounds.minAmount,
    maxAmount: Number.isFinite(maxAmountParam as number)
      ? maxAmountParam
      : parsedAmountBounds.maxAmount,
    flag: typeof searchParams.flag === "string" ? searchParams.flag : undefined,
    sort:
      typeof searchParams.sort === "string" &&
      ["date", "total", "merchant", "category"].includes(searchParams.sort)
        ? (searchParams.sort as ReceiptFilters["sort"])
        : "date",
    order:
      typeof searchParams.order === "string" && ["asc", "desc"].includes(searchParams.order)
        ? (searchParams.order as ReceiptFilters["order"])
        : "desc",
  };
}
