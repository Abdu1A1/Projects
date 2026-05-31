import Link from 'next/link';
import {
  Camera,
  Search,
  PieChart,
  Sparkles,
  ShieldCheck,
  FileDown,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

const features = [
  {
    icon: Camera,
    title: 'Snap any receipt',
    body: 'Phone camera, drag-and-drop, or batch up to 10 at once. JPG, PNG, HEIC, PDF.',
  },
  {
    icon: Sparkles,
    title: 'AI does the data entry',
    body: 'Claude vision extracts merchant, totals, tax, line items, and category in seconds.',
  },
  {
    icon: PieChart,
    title: 'See where your money goes',
    body: 'Dashboard with category donuts, daily spending lines, and your top merchants.',
  },
  {
    icon: Search,
    title: 'Search everything',
    body: 'Full-text search across merchants, items, and tags. "gas april", "over $100", "milk".',
  },
  {
    icon: ShieldCheck,
    title: 'Smart flags',
    body: 'Catch high tax, duplicates, refunds, and suspicious charges automatically.',
  },
  {
    icon: FileDown,
    title: 'Export anytime',
    body: 'CSV for spreadsheets, PDF report for taxes, expense reports, or your accountant.',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              R
            </span>
            ReceiptAI
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="container py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-secondary/60 px-3 py-1 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" /> Powered by Claude Sonnet 4
          </div>
          <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight">
            Snap a receipt.
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              We do the rest.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            ReceiptAI extracts, categorizes, and organizes every receipt in seconds. Search,
            export, and never lose a deduction again.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/signup">
                Start free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">I have an account</Link>
            </Button>
          </div>
        </section>

        <section className="container pb-24">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-xl border bg-card p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="container py-8 text-sm text-muted-foreground">
          Built with Next.js, Supabase, Cloudinary, and Anthropic Claude.
        </div>
      </footer>
    </div>
  );
}
