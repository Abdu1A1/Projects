import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="text-center">
        <h1 className="text-7xl font-bold tracking-tight">404</h1>
        <p className="mt-2 text-muted-foreground">We couldn&apos;t find that page.</p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
