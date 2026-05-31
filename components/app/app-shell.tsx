"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Library, LogOut, Receipt, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import type { SessionUser } from "@/lib/types";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "Library", icon: Library },
];

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <Link href="/" className="text-lg font-semibold tracking-tight">
                ReceiptAI
              </Link>
              <p className="text-xs text-muted-foreground">Save, search, and summarize every receipt in one place.</p>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    pathname === item.href ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden text-right text-sm sm:block">
              <p className="font-medium">{user.email || "ReceiptAI user"}</p>
              <p className="text-xs text-muted-foreground">{user.isDemo ? "Demo mode" : "Secure Supabase session"}</p>
            </div>
            <ThemeToggle />
            {!user.isDemo ? (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const client = getBrowserSupabaseClient();
                  await client?.auth.signOut();
                  router.push("/login");
                  router.refresh();
                }}
                type="button"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            ) : (
              <div className="hidden items-center gap-2 rounded-full bg-primary/10 px-3 py-2 text-xs font-medium text-primary sm:inline-flex">
                <Sparkles className="h-3.5 w-3.5" /> Demo data active
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>

      <nav className="fixed bottom-4 left-1/2 z-30 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-full border border-border/80 bg-background/95 px-4 py-3 shadow-lg backdrop-blur md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 px-3 text-xs", pathname === item.href ? "text-primary" : "text-muted-foreground")}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
