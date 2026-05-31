'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const items = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/library', label: 'Receipts' },
  { href: '/folders', label: 'Folders' },
  { href: '/upload', label: 'Upload' },
];

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 text-sm font-medium">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-md px-3 py-1.5 transition-colors hover:bg-accent hover:text-accent-foreground',
              active ? 'bg-secondary text-foreground' : 'text-muted-foreground',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
