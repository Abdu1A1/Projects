import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function currency(amount: number | null | undefined, code = "CAD") {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function toDateInput(value: string | null | undefined) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function parseAmountFromQuery(query: string) {
  const overMatch = query.match(/over\s*\$?(\d+(?:\.\d+)?)/i);
  const underMatch = query.match(/under\s*\$?(\d+(?:\.\d+)?)/i);

  return {
    minAmount: overMatch ? Number(overMatch[1]) : null,
    maxAmount: underMatch ? Number(underMatch[1]) : null,
  };
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
