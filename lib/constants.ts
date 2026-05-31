export const DEFAULT_CATEGORIES = [
  "Grocery",
  "Restaurant",
  "Gas",
  "Shopping",
  "Bills",
  "Subscriptions",
  "Electronics",
  "Home",
  "Pets",
  "Medical",
  "Travel",
  "Business",
  "School",
  "Other",
] as const;

export const FLAG_META: Record<string, { label: string; className: string; description: string }> = {
  high_tax: {
    label: "High tax",
    className: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
    description: "Tax is more than 20% of the subtotal.",
  },
  possible_duplicate: {
    label: "Possible duplicate",
    className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
    description: "Same merchant and total appears within 24 hours.",
  },
  refund_detected: {
    label: "Refund",
    className: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    description: "Receipt looks like a refund.",
  },
  missing_total: {
    label: "Missing total",
    className: "bg-red-500/15 text-red-700 dark:text-red-300",
    description: "No total could be found.",
  },
  suspicious_charge: {
    label: "Suspicious",
    className: "bg-red-500/15 text-red-700 dark:text-red-300",
    description: "One item is more than 80% of the total.",
  },
  low_confidence: {
    label: "Low confidence",
    className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300",
    description: "Claude was not confident in the extraction.",
  },
};

export const MAX_BATCH_SIZE = 10;
export const MAX_CONCURRENT_UPLOADS = 5;
export const DEFAULT_CURRENCY = "CAD";
export const CLAUDE_MODEL = "claude-sonnet-4-20250514";
