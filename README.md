# ReceiptAI

ReceiptAI is a full-stack AI receipt and invoice saver built with Next.js App Router, Supabase, Cloudinary, and Anthropic Claude vision.

## Stack

- **Frontend:** Next.js 14 App Router + Tailwind CSS + shadcn-style UI primitives
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Database:** Supabase PostgreSQL
- **Image Storage:** Cloudinary (`auto:improve` transformation)
- **AI:** Anthropic Claude (`claude-sonnet-4-20250514`)
- **Charts:** Recharts
- **CSV Export:** Papa Parse
- **PDF Export:** `@react-pdf/renderer`

## Features in V1

- Mobile camera-first receipt capture + desktop drag-and-drop
- Batch queue processing (max 10 files, 5 concurrent)
- Cloudinary upload + single Claude vision call extraction
- Library with full-text search, filters, sort, and flag badges
- Detail page with inline editing, duplicate compare modal, tag/category edits
- Folder/archive modes: by time and by merchant
- Dashboard cards + charts + AI monthly summary
- CSV export + PDF report export
- Supabase RLS policies for per-user access

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy env file and fill secrets:

```bash
cp .env.example .env.local
```

3. Run SQL in Supabase SQL editor:

```bash
# open and run
supabase/schema.sql
```

4. Start dev server:

```bash
npm run dev
```

## Important notes

- The ingestion API endpoint is: `POST /api/receipts/ingest` (multipart form with `file`).
- Search/filter endpoint is: `GET /api/receipts/query`.
- Detail CRUD endpoint is: `/api/receipts/[id]`.

## Deferred to V2

- Barcode scanning
- Budget alerts
- Push notifications
- Sharing/collaboration
- Excel export
- Model fine-tuning
