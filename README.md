# ReceiptAI

ReceiptAI is a full-stack AI receipt and invoice saver built with Next.js 14 App Router, Tailwind CSS, shadcn-style UI primitives, Supabase Auth/Postgres, Cloudinary uploads, and Anthropic Claude.

## Features

- Supabase Auth with email/password and Google OAuth
- Protected routes with session-aware middleware
- Batch receipt uploads with drag/drop, camera capture, queue states, retry, and concurrency limiting
- Cloudinary upload pipeline with enhancement before Claude vision extraction
- Claude receipt parsing using the exact system prompt from the spec
- Receipt library with full-text search filters, folder views, and exports
- Inline-editable receipt detail page with duplicate comparison modal
- Dashboard with Recharts visualizations and AI monthly summary
- CSV export via Papa Parse and PDF export via react-pdf
- Supabase SQL migration with RLS, search triggers, and user correction storage for few-shot prompting
- Demo fallback mode when env vars are not configured

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Fill in:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `ANTHROPIC_API_KEY`

4. Apply the Supabase migration in `supabase/migrations/20260531000000_init_receiptai.sql`.

5. Start the app:

   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` - Start the Next.js app
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks
- `npm run build` - Create a production build

## Notes

- When Supabase env vars are not configured, the app automatically falls back to demo mode with sample receipts.
- The `category_corrections` table stores user fixes and feeds them back into future Claude prompts as few-shot guidance.
- PDF uploads are uploaded to Cloudinary and rendered from the first page preview for Claude extraction in V1.
