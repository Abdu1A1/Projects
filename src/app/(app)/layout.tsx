import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserMenu } from '@/components/user-menu';
import { AppNav } from '@/components/app-nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground text-sm">
                R
              </span>
              <span className="hidden sm:inline">ReceiptAI</span>
            </Link>
            <AppNav />
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <UserMenu email={user.email ?? ''} />
          </div>
        </div>
      </header>
      <main className="flex-1 pb-24 md:pb-8">{children}</main>
      <MobileCta />
    </div>
  );
}

function MobileCta() {
  return (
    <div className="md:hidden fixed bottom-4 left-0 right-0 z-30 flex justify-center pointer-events-none">
      <Link
        href="/upload"
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-primary-foreground shadow-lg shadow-primary/30 font-semibold"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
        Snap receipt
      </Link>
    </div>
  );
}
