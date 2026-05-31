import Link from "next/link";
import { logoutAction } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xl font-semibold tracking-tight">
              ReceiptAI
            </Link>
            <nav className="hidden gap-2 md:flex">
              <Link className="rounded-md px-3 py-2 text-sm hover:bg-muted" href="/capture">
                Capture
              </Link>
              <Link className="rounded-md px-3 py-2 text-sm hover:bg-muted" href="/library">
                Library
              </Link>
              <Link className="rounded-md px-3 py-2 text-sm hover:bg-muted" href="/folders">
                Folders
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action={logoutAction}>
              <Button variant="outline" size="sm" type="submit">
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl p-4 pb-24 md:pb-8">{children}</main>
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-3 md:hidden">
        <Link href="/capture" className="block">
          <Button className="h-12 w-full text-base" size="lg">
            Open Camera
          </Button>
        </Link>
      </div>
    </div>
  );
}
