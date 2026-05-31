import type { Category, Flag } from './types';

export const CATEGORIES: Category[] = [
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
];

export const CATEGORY_COLORS: Record<string, string> = {
  Grocery: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  Restaurant: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  Gas: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Shopping: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  Bills: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  Subscriptions: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  Electronics: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  Home: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  Pets: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-300',
  Medical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  Travel: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  Business: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  School: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  Other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

export const FLAG_META: Record<
  Flag,
  { color: string; label: string; description: string }
> = {
  high_tax: {
    color: 'bg-orange-500 text-white',
    label: 'High tax',
    description: 'Tax is more than 20% of subtotal.',
  },
  possible_duplicate: {
    color: 'bg-yellow-400 text-black',
    label: 'Possible duplicate',
    description: 'Same merchant + total within 24 hours.',
  },
  refund_detected: {
    color: 'bg-blue-500 text-white',
    label: 'Refund',
    description: 'Negative total or "REFUND" detected.',
  },
  missing_total: {
    color: 'bg-red-500 text-white',
    label: 'Missing total',
    description: 'No total could be found.',
  },
  suspicious_charge: {
    color: 'bg-red-600 text-white',
    label: 'Suspicious charge',
    description: 'One item exceeds 80% of the total.',
  },
  low_confidence: {
    color: 'bg-yellow-500 text-black',
    label: 'Low confidence',
    description: 'AI confidence is below 0.7.',
  },
};

export const ACCEPTED_FILE_TYPES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
  'application/pdf': ['.pdf'],
};

export const MAX_BATCH = 10;
export const MAX_CONCURRENCY = 5;
