# ReceiptAI

A full-stack AI-powered Receipt & Invoice Saver app built with Next.js 14, Supabase, Cloudinary, and Anthropic Claude.

## Features

- **AI Receipt Parsing** — Upload receipts and Claude AI extracts merchant, total, tax, line items, category, and more
- **Batch Upload** — Upload up to 10 receipts at once with concurrent processing and real-time status
- **Smart Categorization** — Auto-categorized with 14 built-in categories; corrections improve future AI suggestions
- **Receipt Library** — Grid view with full-text search, filters by category, date range, amount, and flags
- **Dashboard** — Spending stats, AI monthly summary, and charts (donut, line, bar) via Recharts
- **Folder/Archive View** — Browse by time (Year > Month) or by Merchant
- **CSV Export** — Export receipts with all fields via Papa Parse
- **Flag System** — Automatic detection of high tax, duplicates, refunds, missing totals, and suspicious charges
- **Dark Mode** — Full dark mode support
- **Mobile-first** — Camera button FAB on mobile, drag-and-drop on desktop
- **Auth** — Email/password + Google OAuth via Supabase Auth
- **Row Level Security** — All data scoped to authenticated user

## Stack

- **Frontend**: Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui (base-nova)
- **Auth + Database**: Supabase (PostgreSQL + Row Level Security)
- **Image Storage**: Cloudinary (auto:improvement transformation)
- **AI**: Anthropic Claude (`claude-sonnet-4-20250514`)
- **Charts**: Recharts
- **CSV Export**: Papa Parse
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

Required environment variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |

### 3. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase/schema.sql` in the Supabase SQL editor
3. Enable Google OAuth in Authentication > Providers > Google
4. Set the redirect URL to `https://your-domain.com/api/auth/callback`

### 4. Set up Cloudinary

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Copy your Cloud Name, API Key, and API Secret from the dashboard

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Database Schema

The app uses the following tables:

- **users** — User profiles (synced from Supabase Auth)
- **receipts** — Receipt data with AI-extracted fields
- **line_items** — Individual line items per receipt
- **tags** — User-defined tags per receipt
- **categories** — Custom and default categories per user
- **user_corrections** — Category corrections for few-shot AI prompting

Full-text search is powered by a `tsvector` field with a Postgres trigger that auto-updates on receipt, line item, and tag changes.

## AI Prompting Strategy

Claude receives receipt images with a structured system prompt that:
1. Defines the exact JSON output format
2. Lists valid categories
3. Specifies flag detection rules
4. Incorporates user correction history as few-shot examples (no fine-tuning)

If Claude fails to parse a receipt, the image is saved and marked `confidence: 0` for manual review.

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes (upload, receipts, dashboard, export)
│   ├── auth/          # Login and signup pages
│   ├── dashboard/     # Dashboard with stats and charts
│   ├── folders/       # Folder/archive view (by time or merchant)
│   ├── library/       # Receipt grid with search and filters
│   └── receipts/[id]/ # Receipt detail with inline editing
├── components/
│   ├── dashboard/     # Stat cards and Recharts wrappers
│   ├── layout/        # AppLayout with sidebar navigation
│   ├── receipts/      # ReceiptCard, FlagBadge, skeletons
│   └── upload/        # UploadModal with batch processing queue
├── lib/
│   ├── claude.ts      # Anthropic Claude API integration
│   ├── cloudinary.ts  # Cloudinary upload/delete
│   └── supabase/      # Supabase client, server, and middleware
└── types/             # TypeScript types and constants
```
