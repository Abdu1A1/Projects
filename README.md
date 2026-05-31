# ReceiptAI

A full-stack AI receipt and invoice saver. Snap a receipt, Claude extracts the data, and the app categorizes, searches, charts, and exports it for you.

## Stack

- **Next.js 14** App Router + Tailwind CSS + shadcn-style UI
- **Supabase** Postgres + Auth (email/password + Google OAuth) + Row Level Security
- **Cloudinary** image storage with auto-enhancement (`auto:improvement`)
- **Anthropic Claude** (`claude-sonnet-4-20250514`) vision for OCR, extraction, categorization, summary
- **Recharts** for the dashboard
- **Papa Parse** CSV export · **react-pdf** PDF reports

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set up the database

Open the Supabase SQL editor and run [`supabase/schema.sql`](supabase/schema.sql). It creates:

- `users`, `receipts`, `line_items`, `tags`, `categories`, `user_corrections`
- A `search_vector` `tsvector` column on `receipts` with triggers that combine merchant, category, line items, and tags
- A trigger on `auth.users` that mirrors signups into `public.users`
- Row Level Security policies that scope every table to `auth.uid()`

### 4. Configure Google OAuth (optional)

In the Supabase dashboard → Authentication → Providers, enable Google and set the callback URL to:

```
https://YOUR_PROJECT.supabase.co/auth/v1/callback
```

### 5. Run the app

```bash
npm run dev
```

Visit http://localhost:3000.

## Project layout

```
src/
  app/
    (app)/                Protected app routes — dashboard, library, folders, upload
    api/                  Server-only route handlers (process, exports, etc.)
    auth/                 OAuth + signout endpoints
    login/, signup/       Public auth pages
    page.tsx              Marketing landing page
  components/
    ui/                   shadcn-style primitives
    auth/                 Auth form
    dashboard/            Stat cards, charts, monthly AI summary
    folders/              Time / merchant folder view
    library/              Library grid + filters
    receipt/              Receipt card + detail
    upload/               Drag-and-drop + camera batch uploader
  lib/
    supabase/             Browser, server, middleware clients
    receipts/             Queries, stats, post-processing
    anthropic.ts          Claude vision + monthly summary calls
    cloudinary.ts         Server-side upload helper
    cloudinary-url.ts     Client-safe URL helper
supabase/
  schema.sql              Database schema, triggers, and RLS policies
```

## Feature checklist

- [x] Email/password + Google OAuth via Supabase Auth
- [x] Camera + drag-and-drop with batch queue (max 10, 5 concurrent, retry)
- [x] Claude vision extraction with strict JSON contract + post-processed flags
- [x] User correction history fed back as few-shot context
- [x] Library grid with URL-synced filters, sort, and full-text search
- [x] Smart query parsing: "gas april", "over $100", merchant + line item search
- [x] Receipt detail with inline editing, AI summary, line items, tags, low-confidence banner, duplicate compare modal
- [x] Folder view — by time and by merchant; custom folders
- [x] Dashboard — stat cards, donut/line/bar charts, AI monthly summary
- [x] CSV export (Papa Parse) and PDF report (react-pdf, data-only)
- [x] Flag system with colored badges and tooltips
- [x] Dark mode, skeleton loaders, mobile-first layout, sticky camera CTA

## Deferred to V2

Barcode scanning, budget alerts, push notifications, sharing/collab, Excel export, fine-tuning.
