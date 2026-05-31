import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Receipt, Scan, BarChart3, Download, Shield, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">ReceiptAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Get started free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Zap className="w-4 h-4" />
          Powered by Gemini AI
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
          Never lose a receipt
          <br />
          <span className="text-indigo-600">again.</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
          Snap a photo, get instant AI extraction. ReceiptAI automatically reads, categorizes, 
          and organizes your receipts and invoices — no manual entry needed.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/signup">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 text-lg h-auto">
              Start for free
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="lg" variant="outline" className="px-8 py-4 text-lg h-auto">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Scan,
              title: 'AI-Powered OCR',
              description: 'Google Gemini AI extracts merchant, total, tax, line items, and more — instantly from any receipt photo.',
              color: 'text-indigo-600',
              bg: 'bg-indigo-100 dark:bg-indigo-900/30',
            },
            {
              icon: BarChart3,
              title: 'Spending Insights',
              description: 'Beautiful charts show your spending by category, merchant, and over time. AI monthly summaries included.',
              color: 'text-purple-600',
              bg: 'bg-purple-100 dark:bg-purple-900/30',
            },
            {
              icon: Download,
              title: 'Export Anywhere',
              description: 'Export your receipts as CSV or PDF reports for tax season, expense reports, or personal records.',
              color: 'text-green-600',
              bg: 'bg-green-100 dark:bg-green-900/30',
            },
            {
              icon: Shield,
              title: 'Secure & Private',
              description: 'Your data is encrypted and only accessible to you. Row-level security ensures complete privacy.',
              color: 'text-blue-600',
              bg: 'bg-blue-100 dark:bg-blue-900/30',
            },
            {
              icon: Receipt,
              title: 'Smart Categories',
              description: 'Automatic categorization with learning from your corrections. 14 built-in categories plus custom folders.',
              color: 'text-orange-600',
              bg: 'bg-orange-100 dark:bg-orange-900/30',
            },
            {
              icon: Zap,
              title: 'Batch Processing',
              description: 'Upload up to 10 receipts at once. Process them concurrently with real-time status updates.',
              color: 'text-yellow-600',
              bg: 'bg-yellow-100 dark:bg-yellow-900/30',
            },
          ].map(({ icon: Icon, title, description, color, bg }) => (
            <div key={title} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">{title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 pb-24 text-center">
        <div className="bg-indigo-600 rounded-3xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to get organized?</h2>
          <p className="text-indigo-200 mb-8 text-lg">Join thousands of people who use ReceiptAI to stay on top of their finances.</p>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-4 text-lg h-auto font-semibold">
              Create free account
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 text-center text-sm text-gray-500">
        <p>© 2026 ReceiptAI. Built with Next.js, Supabase, and Google Gemini.</p>
      </footer>
    </div>
  );
}
