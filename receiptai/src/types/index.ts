export type FlagType =
  | 'high_tax'
  | 'possible_duplicate'
  | 'refund_detected'
  | 'missing_total'
  | 'suspicious_charge'
  | 'low_confidence';

export const CATEGORIES = [
  'Grocery',
  'Restaurant',
  'Gas',
  'Shopping',
  'Bills',
  'Subscriptions',
  'Electronics',
  'Home',
  'Pets',
  'Medical',
  'Travel',
  'Business',
  'School',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface LineItem {
  id: string;
  receipt_id: string;
  name: string;
  qty: number;
  price: number;
}

export interface Tag {
  id: string;
  receipt_id: string;
  label: string;
}

export interface Receipt {
  id: string;
  user_id: string;
  image_url: string | null;
  raw_text: string | null;
  merchant: string | null;
  date: string | null;
  time: string | null;
  total: number | null;
  tax: number | null;
  currency: string;
  payment_method: string | null;
  category: string | null;
  summary: string | null;
  flags: FlagType[];
  confidence: number | null;
  created_at: string;
  updated_at: string;
  line_items?: LineItem[];
  tags?: Tag[];
}

export interface ReceiptWithDetails extends Receipt {
  line_items: LineItem[];
  tags: Tag[];
}

export interface ClaudeExtraction {
  merchant: string | null;
  date: string | null;
  time: string | null;
  total: number | null;
  tax: number | null;
  currency: string | null;
  payment_method: string | null;
  category: string | null;
  line_items: Array<{ name: string; qty: number; price: number }>;
  summary: string;
  flags: FlagType[];
  confidence: number;
}

export interface UploadQueueItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'done' | 'failed';
  progress: number;
  receipt?: Receipt;
  error?: string;
  previewUrl?: string;
}

export interface DashboardStats {
  totalThisMonth: number;
  topCategory: string | null;
  highestReceipt: number | null;
  receiptsThisWeek: number;
  monthlyAISummary: string | null;
}

export interface SpendingByCategory {
  category: string;
  total: number;
  count: number;
}

export interface DailySpending {
  date: string;
  total: number;
}

export interface MerchantSpending {
  merchant: string;
  total: number;
  count: number;
}

export interface FilterState {
  search: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
  flags: FlagType[];
  sortBy: 'date' | 'total' | 'merchant' | 'category';
  sortOrder: 'asc' | 'desc';
}

export const FLAG_CONFIG: Record<
  FlagType,
  { label: string; color: string; bgColor: string; description: string }
> = {
  high_tax: {
    label: 'High Tax',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    description: 'Tax > 20% of subtotal',
  },
  possible_duplicate: {
    label: 'Possible Duplicate',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    description: 'Same merchant + total within 24hrs',
  },
  refund_detected: {
    label: 'Refund',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    description: 'Negative total or REFUND detected',
  },
  missing_total: {
    label: 'Missing Total',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    description: 'No total found',
  },
  suspicious_charge: {
    label: 'Suspicious',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    description: 'One item > 80% of total',
  },
  low_confidence: {
    label: 'Low Confidence',
    color: 'text-yellow-700 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    description: 'AI confidence < 70%',
  },
};

export const CATEGORY_COLORS: Record<string, string> = {
  Grocery: '#10b981',
  Restaurant: '#f59e0b',
  Gas: '#ef4444',
  Shopping: '#8b5cf6',
  Bills: '#3b82f6',
  Subscriptions: '#06b6d4',
  Electronics: '#6366f1',
  Home: '#84cc16',
  Pets: '#f97316',
  Medical: '#ec4899',
  Travel: '#14b8a6',
  Business: '#64748b',
  School: '#a855f7',
  Other: '#94a3b8',
};
