# ReceiptAI

A full-stack AI-powered Receipt & Invoice Saver app built with Next.js 14, Supabase, and Google Gemini.

## Features

- **AI Receipt Parsing** — Upload receipts and Gemini AI extracts merchant, total, tax, line items, category, and more
- **Batch Upload** — Upload up to 10 receipts at once with concurrent processing (max 5 parallel) and real-time status
- **Smart Categorization** — Auto-categorized with 14 built-in categories; user corrections improve future AI suggestions via few-shot prompting
- **Receipt Library** — Grid view with full-text search, filters by category, date range, amount, and flags
- **Dashboard** — Spending stats, AI monthly summary, and charts (donut, line, bar) via Recharts
- **Folder/Archive View** — Browse by time (Year > Month > Category), by Merchant, or by Category with custom folders
- **CSV & PDF Export** — Export receipts via Papa Parse (CSV) and react-pdf (PDF reports)
- **Flag System** — Automatic detection of high tax, duplicates, refunds, missing totals, and suspicious charges
- **Duplicate Compare** — Side-by-side modal for suspected duplicate receipts
- **Dark Mode** — Full dark mode support
- **Mobile-first** — Centered camera button at bottom on mobile, drag-and-drop on desktop
- **Auth** — Email/password + Google OAuth via Supabase Auth
- **Row Level Security** — All data scoped to authenticated user

## Stack

- **Frontend**: Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui
- **Auth + Database + Storage**: Supabase (PostgreSQL + Row Level Security + Storage)
- **AI**: Google Gemini (`gemini-1.5-flash` — free tier, vision input)
- **Charts**: Recharts
- **CSV Export**: Papa Parse
- **PDF Export**: react-pdf
- **Icons**: Lucide React

## Setup

### 1. Clone and install

```bash
cd receiptai
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `GOOGLE_GEMINI_API_KEY` | Your Google Gemini API key |

### 3. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase/schema.sql` in the Supabase SQL editor
3. Enable Google OAuth in Authentication > Providers > Google
4. Set the redirect URL to `https://your-domain.com/api/auth/callback`

### 4. Get a Gemini API key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key for the Gemini API (free tier supports `gemini-1.5-flash`)

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Database Schema

- **users** — User profiles (synced from Supabase Auth)
- **receipts** — Receipt data with AI-extracted fields and full-text search vector
- **line_items** — Individual line items per receipt
- **tags** — User-defined tags per receipt
- **categories** — Default and custom categories per user
- **user_corrections** — Category corrections for few-shot AI prompting

Full-text search is powered by a `tsvector` field with Postgres triggers that auto-update on receipt, line item, and tag changes.

## AI Prompting Strategy

Gemini receives receipt images with a structured system prompt that:
1. Defines the exact JSON output format
2. Lists valid categories and merchant-specific rules
3. Specifies flag detection rules
4. Incorporates user correction history as few-shot examples (no fine-tuning)

If parsing fails, the image is saved and marked `confidence: 0` for manual review.

## Project Structure

```
src/
├── app/
│   ├── api/           # Upload, receipts, dashboard, export, categories
│   ├── auth/          # Login and signup pages
│   ├── dashboard/     # Dashboard with stats and charts
│   ├── folders/       # Folder view (time, merchant, category)
│   ├── library/       # Receipt grid with search and filters
│   └── receipts/[id]/ # Receipt detail with inline editing
├── components/
│   ├── dashboard/     # Stat cards and Recharts wrappers
│   ├── layout/        # AppLayout with sidebar navigation
│   ├── receipts/      # ReceiptCard, FlagBadge, CompareModal, PDF export
│   └── upload/        # UploadModal with batch processing queue
├── lib/
│   ├── gemini.ts      # Google Gemini API integration
│   ├── storage.ts     # Supabase Storage upload/delete
│   └── supabase/      # Supabase client, server, and middleware
└── types/             # TypeScript types and constants
```
