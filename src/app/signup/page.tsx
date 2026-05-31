import Link from 'next/link';
import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/auth-form';

export const metadata = { title: 'Sign up · ReceiptAI' };

export default function SignupPage() {
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
          <h1 className="mt-6 text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Start tracking receipts in seconds.
          </p>
        </div>
        <Suspense>
          <AuthForm mode="signup" />
        </Suspense>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
