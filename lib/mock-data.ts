import type { Category, Receipt } from "@/lib/types";
import { DEFAULT_CATEGORIES } from "@/lib/constants";

const DEMO_USER_ID = "demo-user";
const now = new Date();
const isoDay = (offset: number) => new Date(now.getTime() - offset * 86400000).toISOString().slice(0, 10);

export const demoCategories: Category[] = DEFAULT_CATEGORIES.map((name, index) => ({
  id: `category-${index}`,
  user_id: DEMO_USER_ID,
  name,
  is_custom: false,
}));

export let demoReceipts: Receipt[] = [
  {
    id: "receipt-1",
    user_id: DEMO_USER_ID,
    image_url: "https://placehold.co/800x1200/png?text=Costco+Receipt",
    raw_text: "Demo receipt text",
    merchant: "Costco",
    date: isoDay(3),
    time: "13:24",
    total: 142.88,
    tax: 17.42,
    currency: "CAD",
    payment_method: "Visa",
    category: "Grocery",
    summary: "Bulk grocery run with household goods and produce.",
    flags: [],
    confidence: 0.92,
    created_at: new Date(now.getTime() - 3 * 86400000).toISOString(),
    line_items: [
      { id: "li-1", name: "Milk", qty: 2, price: 7.98 },
      { id: "li-2", name: "Paper towels", qty: 1, price: 24.99 },
    ],
    tags: [{ id: "tag-1", label: "bulk" }],
  },
  {
    id: "receipt-2",
    user_id: DEMO_USER_ID,
    image_url: "https://placehold.co/800x1200/png?text=Shell+Receipt",
    raw_text: "Demo receipt text",
    merchant: "Shell",
    date: isoDay(10),
    time: "08:05",
    total: 73.2,
    tax: 0,
    currency: "CAD",
    payment_method: "Amex",
    category: "Gas",
    summary: "Fuel stop during weekday commute.",
    flags: [],
    confidence: 0.89,
    created_at: new Date(now.getTime() - 10 * 86400000).toISOString(),
    line_items: [{ id: "li-3", name: "Regular Fuel", qty: 42.18, price: 73.2 }],
    tags: [{ id: "tag-2", label: "car" }],
  },
  {
    id: "receipt-3",
    user_id: DEMO_USER_ID,
    image_url: "https://placehold.co/800x1200/png?text=Amazon+Invoice",
    raw_text: "Demo invoice text",
    merchant: "Amazon",
    date: isoDay(14),
    time: "20:41",
    total: 219.99,
    tax: 28.6,
    currency: "CAD",
    payment_method: "Mastercard",
    category: "Shopping",
    summary: "Online order for office and home gear.",
    flags: ["suspicious_charge"],
    confidence: 0.81,
    created_at: new Date(now.getTime() - 14 * 86400000).toISOString(),
    line_items: [{ id: "li-4", name: "Monitor stand", qty: 1, price: 189.99 }],
    tags: [{ id: "tag-3", label: "office" }],
  },
  {
    id: "receipt-4",
    user_id: DEMO_USER_ID,
    image_url: "https://placehold.co/800x1200/png?text=Tim+Hortons",
    raw_text: "Demo receipt text",
    merchant: "Tim Hortons",
    date: isoDay(1),
    time: "09:14",
    total: 11.8,
    tax: 1.4,
    currency: "CAD",
    payment_method: "Debit",
    category: "Restaurant",
    summary: "Coffee and breakfast sandwich.",
    flags: [],
    confidence: 0.95,
    created_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
    line_items: [{ id: "li-5", name: "Breakfast combo", qty: 1, price: 10.4 }],
    tags: [{ id: "tag-4", label: "coffee" }],
  },
  {
    id: "receipt-5",
    user_id: DEMO_USER_ID,
    image_url: "https://placehold.co/800x1200/png?text=Shell+Duplicate",
    raw_text: "Demo duplicate receipt",
    merchant: "Shell",
    date: isoDay(10),
    time: "18:35",
    total: 73.2,
    tax: 0,
    currency: "CAD",
    payment_method: "Amex",
    category: "Gas",
    summary: "Second fuel receipt with matching amount for duplicate comparison.",
    flags: ["possible_duplicate"],
    confidence: 0.77,
    created_at: new Date(now.getTime() - 10 * 86400000 + 4 * 3600000).toISOString(),
    line_items: [{ id: "li-6", name: "Regular Fuel", qty: 41.9, price: 73.2 }],
    tags: [{ id: "tag-5", label: "duplicate-check" }],
  },
];

export let demoCorrections: Array<{
  id: string;
  user_id: string;
  merchant: string | null;
  original_category: string | null;
  corrected_category: string;
}> = [];

export function resetDemoState() {
  demoReceipts = [...demoReceipts];
}
