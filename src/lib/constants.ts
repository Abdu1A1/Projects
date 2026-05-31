export const APP_NAME = "ReceiptAI";

export const DEFAULT_CURRENCY = "CAD";

export const CATEGORY_OPTIONS = [
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

export const FLAG_META = {
  high_tax: {
    label: "High tax",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  },
  possible_duplicate: {
    label: "Possible duplicate",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  },
  refund_detected: {
    label: "Refund",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  },
  missing_total: {
    label: "Missing total",
    className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
  suspicious_charge: {
    label: "Suspicious charge",
    className: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  },
  low_confidence: {
    label: "Low confidence",
    className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  },
} as const;

export const MONTH_NAMES = [
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
