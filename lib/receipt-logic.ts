import { endOfMonth, format, isAfter, isBefore, isSameMonth, parseISO, startOfMonth, subDays } from "date-fns";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { clampConfidence } from "@/lib/format";
import { extractQueryHints } from "@/lib/search";
import type { DashboardStats, FolderGroup, Receipt, ReceiptExtraction, ReceiptFilters, ReceiptFlag } from "@/lib/types";

export function normalizeExtraction(extraction: ReceiptExtraction): ReceiptExtraction {
  const flags = new Set<ReceiptFlag>(extraction.flags || []);
  const total = extraction.total ?? null;
  const tax = extraction.tax ?? null;
  const subtotal = total !== null && tax !== null ? total - tax : null;

  if (subtotal !== null && subtotal > 0 && tax !== null && tax > subtotal * 0.2) {
    flags.add("high_tax");
  }

  if (total === null) {
    flags.add("missing_total");
  }

  if ((total ?? 0) < 0 || /refund/i.test(extraction.summary)) {
    flags.add("refund_detected");
  }

  const hasSuspiciousItem = extraction.line_items.some((item) => {
    if (!item.price || !total || total <= 0) return false;
    return item.price > total * 0.8;
  });

  if (hasSuspiciousItem) {
    flags.add("suspicious_charge");
  }

  if (clampConfidence(extraction.confidence) < 0.7) {
    flags.add("low_confidence");
  }

  const category = DEFAULT_CATEGORIES.includes((extraction.category ?? "") as (typeof DEFAULT_CATEGORIES)[number])
    ? extraction.category
    : "Other";

  return {
    ...extraction,
    category,
    currency: extraction.currency || "CAD",
    confidence: clampConfidence(extraction.confidence),
    flags: Array.from(flags),
  };
}

export function applyReceiptFilters(receipts: Receipt[], filters: ReceiptFilters) {
  const hints = extractQueryHints(filters.query);
  const mergedFilters: ReceiptFilters = {
    ...hints.parsed,
    ...filters,
    minAmount: filters.minAmount ?? hints.parsed.minAmount,
    maxAmount: filters.maxAmount ?? hints.parsed.maxAmount,
    dateFrom: filters.dateFrom ?? hints.parsed.dateFrom,
    dateTo: filters.dateTo ?? hints.parsed.dateTo,
  };

  const query = hints.textQuery.toLowerCase();

  return receipts.filter((receipt) => {
    if (mergedFilters.category && receipt.category !== mergedFilters.category) return false;
    if (mergedFilters.flag && !receipt.flags.includes(mergedFilters.flag as ReceiptFlag)) return false;
    if (mergedFilters.minAmount !== undefined && (receipt.total ?? -Infinity) < mergedFilters.minAmount) return false;
    if (mergedFilters.maxAmount !== undefined && (receipt.total ?? Infinity) > mergedFilters.maxAmount) return false;

    if (mergedFilters.dateFrom && receipt.date) {
      if (isBefore(parseISO(receipt.date), parseISO(mergedFilters.dateFrom))) return false;
    }

    if (mergedFilters.dateTo && receipt.date) {
      if (isAfter(parseISO(receipt.date), parseISO(mergedFilters.dateTo))) return false;
    }

    if (query) {
      const haystack = [
        receipt.merchant,
        receipt.category,
        receipt.summary,
        receipt.tags.map((tag) => tag.label).join(" "),
        receipt.line_items.map((item) => item.name).join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

export function sortReceipts(receipts: Receipt[], filters: ReceiptFilters) {
  const sorted = [...receipts];
  const direction = filters.direction === "asc" ? 1 : -1;
  const sort = filters.sort || "date";

  sorted.sort((a, b) => {
    const values: Record<string, string | number> = {
      date: a.date || a.created_at,
      total: a.total ?? 0,
      merchant: a.merchant || "",
      category: a.category || "",
    };

    const otherValues: Record<string, string | number> = {
      date: b.date || b.created_at,
      total: b.total ?? 0,
      merchant: b.merchant || "",
      category: b.category || "",
    };

    const left = values[sort];
    const right = otherValues[sort];

    if (left < right) return -1 * direction;
    if (left > right) return 1 * direction;
    return 0;
  });

  return sorted;
}

export function buildFolderGroups(receipts: Receipt[], view: ReceiptFilters["view"]): FolderGroup[] {
  if (view === "merchant") {
    return Object.entries(
      receipts.reduce<Record<string, Receipt[]>>((acc, receipt) => {
        const key = receipt.merchant || "Unknown merchant";
        acc[key] = acc[key] || [];
        acc[key].push(receipt);
        return acc;
      }, {}),
    ).map(([merchant, merchantReceipts]) => ({
      id: merchant,
      label: merchant,
      receipts: merchantReceipts,
    }));
  }

  if (view === "time") {
    const years = new Map<string, Receipt[]>();
    receipts.forEach((receipt) => {
      const date = receipt.date || receipt.created_at.slice(0, 10);
      const year = date.slice(0, 4);
      years.set(year, [...(years.get(year) || []), receipt]);
    });

    return Array.from(years.entries()).map(([year, yearReceipts]) => {
      const monthsMap = new Map<string, Receipt[]>();
      yearReceipts.forEach((receipt) => {
        const date = parseISO(receipt.date || receipt.created_at.slice(0, 10));
        const key = format(date, "MMMM");
        monthsMap.set(key, [...(monthsMap.get(key) || []), receipt]);
      });

      return {
        id: year,
        label: year,
        receipts: yearReceipts,
        children: Array.from(monthsMap.entries()).map(([month, monthReceipts]) => ({
          id: `${year}-${month}`,
          label: month,
          receipts: monthReceipts,
          children: Object.entries(
            monthReceipts.reduce<Record<string, Receipt[]>>((acc, receipt) => {
              const category = receipt.category || "Other";
              acc[category] = acc[category] || [];
              acc[category].push(receipt);
              return acc;
            }, {}),
          ).map(([category, categoryReceipts]) => ({
            id: `${year}-${month}-${category}`,
            label: category,
            receipts: categoryReceipts,
          })),
        })),
      };
    });
  }

  return [];
}

export function computeDashboardStats(receipts: Receipt[]): DashboardStats {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const thirtyDaysAgo = subDays(now, 29);
  const oneWeekAgo = subDays(now, 6);

  const thisMonth = receipts.filter((receipt) => {
    if (!receipt.date) return false;
    const date = parseISO(receipt.date);
    return !isBefore(date, thisMonthStart) && !isAfter(date, thisMonthEnd);
  });

  const receiptsThisWeek = receipts.filter((receipt) => {
    const date = parseISO(receipt.date || receipt.created_at.slice(0, 10));
    return !isBefore(date, oneWeekAgo);
  }).length;

  const totalSpentThisMonth = thisMonth.reduce((sum, receipt) => sum + (receipt.total || 0), 0);
  const highestReceipt = Math.max(0, ...thisMonth.map((receipt) => receipt.total || 0));

  const categoryTotals = thisMonth.reduce<Record<string, number>>((acc, receipt) => {
    const key = receipt.category || "Other";
    acc[key] = (acc[key] || 0) + (receipt.total || 0);
    return acc;
  }, {});

  const merchantTotals = thisMonth.reduce<Record<string, number>>((acc, receipt) => {
    const key = receipt.merchant || "Unknown";
    acc[key] = (acc[key] || 0) + (receipt.total || 0);
    return acc;
  }, {});

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "None yet";

  const lineSeries = Array.from({ length: 30 }, (_, index) => {
    const date = subDays(now, 29 - index);
    const key = format(date, "yyyy-MM-dd");
    const total = receipts
      .filter((receipt) => receipt.date && format(parseISO(receipt.date), "yyyy-MM-dd") === key)
      .reduce((sum, receipt) => sum + (receipt.total || 0), 0);

    return { date: format(date, "MMM d"), total };
  });

  return {
    totalSpentThisMonth,
    topCategory,
    highestReceipt,
    receiptsThisWeek,
    donutData: Object.entries(categoryTotals).map(([name, value]) => ({ name, value })),
    lineData: lineSeries,
    merchantData: Object.entries(merchantTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([merchant, total]) => ({ merchant, total })),
  };
}

export function findDuplicateCandidate(receipts: Receipt[], receipt: Partial<Receipt>) {
  if (!receipt.merchant || receipt.total === null || receipt.total === undefined) {
    return null;
  }

  const targetDate = parseISO(receipt.date || receipt.created_at || new Date().toISOString());

  return (
    receipts.find((candidate) => {
      if (candidate.id === receipt.id) return false;
      if ((candidate.merchant || "").toLowerCase() !== receipt.merchant?.toLowerCase()) return false;
      if ((candidate.total ?? 0) !== receipt.total) return false;
      const candidateDate = parseISO(candidate.date || candidate.created_at);
      return Math.abs(candidateDate.getTime() - targetDate.getTime()) <= 1000 * 60 * 60 * 24;
    }) || null
  );
}

export function buildMonthLabel(receipts: Receipt[]) {
  const current = receipts.find((receipt) => receipt.date && isSameMonth(parseISO(receipt.date), new Date()));
  return current?.date ? format(parseISO(current.date), "MMMM yyyy") : format(new Date(), "MMMM yyyy");
}
