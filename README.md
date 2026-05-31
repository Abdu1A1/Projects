# ReceiptAI

ReceiptAI is a full-stack AI Receipt & Invoice Saver built with Next.js 14 App Router, Supabase, Cloudinary, and Anthropic Claude.

## Stack

- **Frontend:** Next.js 14 App Router + Tailwind CSS + shadcn-style UI components
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Database:** Supabase PostgreSQL
- **Image Storage:** Cloudinary (`effect: improve` + automatic optimization)
- **AI:** Anthropic Claude `claude-sonnet-4-20250514`
- **Charts:** Recharts
- **CSV Export:** Papa Parse
- **PDF Export:** `@react-pdf/renderer`

## Features in V1

- Authenticated receipt capture (camera + drag/drop + file picker)
- Batch queue processing with per-item status and retry
- Cloudinary upload + Claude extraction + schema validation
- Receipt library with search/filter/sort and URL-synced filters
- Receipt detail page with inline editing, flags, confidence banner, duplicate compare modal
- Smart category correction memory (few-shot prompt examples)
- Folder/archive view (time and merchant grouping + custom category folders)
- Dashboard metrics + charts + monthly AI summary
- CSV/PDF exports (data-only PDF)
- Supabase RLS on all data tables

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment template:

```bash
cp .env.example .env.local
```

3. Fill all required keys in `.env.local`.

4. Run database migration SQL from:

```text
supabase/migrations/0001_receiptai.sql
```

5. Start development server:

```bash
npm run dev
```

## Supabase Notes

- Enable Email/Password and Google provider in Supabase Auth.
- Set OAuth redirect URL to:
  - `http://localhost:3000/auth/callback` for local dev
  - your production domain equivalent
- Ensure RLS remains enabled for all listed tables.

## Claude Extraction Prompt

The extraction pipeline uses this exact system prompt (implemented in `lib/ai.ts`):

```txt
You are a receipt parser. Extract all data from the receipt image and return ONLY valid JSON with this exact structure. Never add explanation. If a field is unreadable return null. Never guess totals.

{
  "merchant": string | null,
  "date": "YYYY-MM-DD" | null,
  "time": "HH:MM" | null,
  "total": number | null,
  "tax": number | null,
  "currency": string | null,
  "payment_method": string | null,
  "category": string | null,
  "line_items": [{ "name": string, "qty": number, "price": number }],
  "summary": string,
  "flags": string[],
  "confidence": number between 0 and 1
}

Category must be one of: Grocery, Restaurant, Gas, Shopping, Bills, Subscriptions, Electronics, Home, Pets, Medical, Travel, Business, School, Other

Flag rules — include the flag string if the condition is true:
- "high_tax" → tax is more than 20% of subtotal
- "possible_duplicate" → note if merchant + total seems repeated
- "refund_detected" → total is negative or receipt contains the word REFUND
- "missing_total" → total could not be found
- "suspicious_charge" → a single line item is more than 80% of the total
- "low_confidence" → you are not confident in the extraction

Category rules:
- Costco → Grocery
- Shell, Esso, Petro-Canada, BP → Gas
- Amazon, eBay → Shopping
- Uber, Lyft, Airbnb → Travel
- Tim Hortons, McDonald's, Subway → Restaurant
```

## Routes

- `/login`, `/signup`
- `/dashboard`
- `/capture`
- `/library`
- `/folders`
- `/receipts/[id]`

## API Endpoints

- `POST /api/receipts/process`
- `PATCH|DELETE /api/receipts/[id]`
- `POST /api/receipts/[id]/retry`
- `PATCH /api/receipts`
- `GET /api/dashboard/summary`

## Deferred to V2

- Barcode scanning
- Budgets / alerts
- Push notifications
- Receipt sharing
- Excel export
- Fine-tuning-based AI learning
