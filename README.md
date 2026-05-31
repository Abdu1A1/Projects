# ReceiptAI

Full-stack AI Receipt & Invoice Saver — see [receiptai/README.md](receiptai/README.md) for setup and documentation.

## Quick Start

```bash
cd receiptai
npm install
cp .env.example .env.local
# Fill in Supabase + Gemini credentials, then run supabase/schema.sql
npm run dev
```

## Stack

- **Next.js 14** App Router + Tailwind CSS + shadcn/ui
- **Supabase** Auth, PostgreSQL, Storage
- **Google Gemini** (`gemini-1.5-flash`) for receipt extraction
- **Recharts**, **Papa Parse**, **react-pdf**
