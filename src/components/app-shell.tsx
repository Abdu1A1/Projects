import Link from "next/link";
import { LayoutDashboard, Library, FolderTree, LogOut } from "lucide-react";

import { signOutAction } from "@/app/actions";
import { ReceiptUploader } from "@/components/upload/receipt-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_NAME } from "@/lib/constants";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "Library", icon: Library },
  { href: "/archive", label: "Archive", icon: FolderTree },
];

export function AppShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail?: string | null;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
              {APP_NAME}
            </div>
            <Badge variant="outline" className="hidden sm:inline-flex">
              AI Receipt & Invoice Saver
            </Badge>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <Button key={item.href} asChild variant="ghost">
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {userEmail ? (
              <Badge variant="outline" className="hidden lg:inline-flex">
                {userEmail}
              </Badge>
            ) : null}
            <form action={signOutAction}>
              <Button variant="outline" size="icon" type="submit" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        <nav className="flex items-center gap-2 overflow-x-auto px-4 pb-3 md:hidden">
          {navItems.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 pb-28">{children}</main>

      <ReceiptUploader />
    </div>
  );
}
