import Link from 'next/link';
import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';

export const metadata = { title: 'Log in · ReceiptAI' };

export default function LoginPage() {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              R
            </span>
            ReceiptAI
          </Link>
          <h1 className="mt-6 text-2xl font-bold">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Log in to continue.</p>
        </div>
        <Suspense>
          <AuthForm mode="login" />
        </Suspense>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
