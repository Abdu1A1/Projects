import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined, currency = "CAD") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatConfidence(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${Math.round(value * 100)}%`;
}

export function parseNumericValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const cleaned = value.replace(/[^0-9.-]/g, "");
  if (!cleaned) {
    return null;
  }

  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function compactNumber(value: number) {
  return new Intl.NumberFormat("en-CA", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
