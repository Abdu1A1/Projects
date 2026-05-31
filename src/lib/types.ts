export type Flag =
  | 'high_tax'
  | 'possible_duplicate'
  | 'refund_detected'
  | 'missing_total'
  | 'suspicious_charge'
  | 'low_confidence';

export type Category =
  | 'Grocery'
  | 'Restaurant'
  | 'Gas'
  | 'Shopping'
  | 'Bills'
  | 'Subscriptions'
  | 'Electronics'
  | 'Home'
  | 'Pets'
  | 'Medical'
  | 'Travel'
  | 'Business'
  | 'School'
  | 'Other';

export interface LineItem {
  id?: string;
  receipt_id?: string;
  name: string;
  qty: number;
  price: number;
}

export interface Tag {
  id?: string;
  receipt_id?: string;
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
  currency: string | null;
  payment_method: string | null;
  category: Category | string | null;
  summary: string | null;
  flags: Flag[] | null;
  confidence: number | null;
  created_at: string;
  line_items?: LineItem[];
  tags?: Tag[];
}

export interface ExtractedReceipt {
  merchant: string | null;
  date: string | null;
  time: string | null;
  total: number | null;
  tax: number | null;
  currency: string | null;
  payment_method: string | null;
  category: Category | null;
  line_items: LineItem[];
  summary: string;
  flags: Flag[];
  confidence: number;
}
