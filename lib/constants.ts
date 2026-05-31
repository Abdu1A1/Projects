export const RECEIPT_CATEGORIES = [
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
    color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    label: "High Tax",
    meaning: "Tax > 20% of subtotal",
  },
  possible_duplicate: {
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    label: "Possible Duplicate",
    meaning: "Same merchant + total within 24 hours",
  },
  refund_detected: {
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    label: "Refund",
    meaning: "Negative total or REFUND detected",
  },
  missing_total: {
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    label: "Missing Total",
    meaning: "No total was found",
  },
  suspicious_charge: {
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    label: "Suspicious Charge",
    meaning: "One item is over 80% of total",
  },
  low_confidence: {
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    label: "Low Confidence",
    meaning: "AI confidence below 0.7",
  },
} as const;

export const SORT_OPTIONS = [
  { value: "date_desc", label: "Date (Newest)" },
  { value: "date_asc", label: "Date (Oldest)" },
  { value: "total_desc", label: "Total (High → Low)" },
  { value: "total_asc", label: "Total (Low → High)" },
  { value: "merchant_asc", label: "Merchant (A-Z)" },
  { value: "category_asc", label: "Category (A-Z)" },
] as const;

export const ACCEPTED_UPLOAD_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "application/pdf",
];

export const MAX_BATCH_SIZE = 10;
export const MAX_CONCURRENT_PROCESSING = 5;
