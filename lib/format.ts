import { format, formatDistanceToNowStrict, parseISO } from "date-fns";

export function formatCurrency(value: number | null | undefined, currency = "CAD") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatReceiptDate(value: string | null | undefined) {
  if (!value) return "Unknown date";

  try {
    return format(parseISO(value), "MMM d, yyyy");
  } catch {
    return value;
  }
}

export function formatRelativeTimestamp(value: string) {
  try {
    return formatDistanceToNowStrict(parseISO(value), { addSuffix: true });
  } catch {
    return value;
  }
}

export function clampConfidence(value: number) {
  return Math.max(0, Math.min(1, value));
}
