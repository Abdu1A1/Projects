# ReceiptAI

ReceiptAI is a mobile-first AI receipt and invoice saver built with Next.js 14 App Router, Tailwind CSS, Supabase Auth/Postgres, Cloudinary uploads, and Anthropic Claude.

## Features

- Email/password and Google OAuth authentication with Supabase
- Receipt upload from mobile camera or desktop drag-and-drop
- Cloudinary upload with automatic image enhancement
- Single Claude vision call for OCR, extraction, categorization, flags, and summary
- Batch queue with up to 5 concurrent workers and retry support
- Searchable receipt library with filters, full-text search, and URL-synced queries
- Inline-editable receipt detail page with duplicate compare flow
- Archive views grouped by time or merchant plus custom category folders
- Spending dashboard with Recharts visualizations and monthly AI summary
- CSV export and monthly PDF report export

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in the Supabase, Cloudinary, and Anthropic credentials in `.env.local`.

4. Run the Supabase migration in `supabase/migrations/202605310001_receiptai.sql`.

5. Start the development server:

   ```bash
   npm run dev
   ```

## Environment variables

```bash
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
ANTHROPIC_API_KEY=
```
