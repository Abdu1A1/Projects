'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Receipt,
  LayoutDashboard,
  Library,
  FolderOpen,
  Camera,
  LogOut,
  Menu,
  Moon,
  Sun,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { UploadModal } from '@/components/upload/UploadModal';
import { ReceiptPDFExport } from '@/components/receipts/ReceiptPDFExport';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/folders', label: 'Folders', icon: FolderOpen },
];

interface AppLayoutProps {
  children: React.ReactNode;
  userEmail?: string;
}

export function AppLayout({ children, userEmail }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
    toast.success('Signed out successfully');
  };

  const handleExportCSV = () => {
    window.open('/api/export?format=csv', '_blank');
  };

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex lg:flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40">
        <div className="flex items-center gap-2 h-16 px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-gray-900 dark:text-white">ReceiptAI</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <Button
            onClick={handleExportCSV}
            variant="ghost"
            className="w-full justify-start gap-3 text-gray-600 dark:text-gray-400"
            size="sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <div className="px-3">
            <ReceiptPDFExport />
          </div>

          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{userEmail}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center w-8 h-8 flex-shrink-0 rounded-lg hover:bg-muted transition-colors">
                  <Menu className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={toggleDarkMode}>
                  {darkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                  {darkMode ? 'Light mode' : 'Dark mode'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger className="inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors">
                <Menu className="w-5 h-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex items-center gap-2 h-16 px-6 border-b border-gray-200 dark:border-gray-800">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">ReceiptAI</span>
              </div>
              <nav className="px-4 py-6 space-y-1">
                {navItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      pathname === href
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="px-4 border-t border-gray-200 py-4 space-y-2">
                <Button
                  onClick={handleExportCSV}
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  size="sm"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-start gap-3 text-red-600"
                  size="sm"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Receipt className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">ReceiptAI</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64 min-h-screen pb-24 lg:pb-0">
        <div className="pt-16 lg:pt-0">{children}</div>
      </main>

      {/* Mobile Camera CTA — centered bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-gray-50 via-gray-50/95 to-transparent dark:from-gray-950 dark:via-gray-950/95 pointer-events-none">
        <button
          onClick={() => setUploadOpen(true)}
          className="pointer-events-auto w-full max-w-sm mx-auto flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl py-4 px-6 shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
          aria-label="Add receipt"
        >
          <Camera className="w-6 h-6" />
          <span className="font-semibold text-base">Snap Receipt</span>
        </button>
      </div>

      {/* Desktop Upload button */}
      <div className="hidden lg:block fixed bottom-8 left-72 z-30">
        <Button
          onClick={() => setUploadOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg gap-2 px-5 py-2.5 rounded-xl h-auto"
        >
          <Camera className="w-4 h-4" />
          Add Receipt
        </Button>
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  );
}
