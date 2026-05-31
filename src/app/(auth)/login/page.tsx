import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <Suspense fallback={<div className="text-sm text-zinc-500">Loading auth…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
