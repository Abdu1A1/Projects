import { AppShell } from "@/components/app-shell";
import { SetupNotice } from "@/components/setup-notice";
import { hasRequiredSupabaseEnv } from "@/lib/env";
import { ensureUserProfile, getSessionUser, requireUser } from "@/lib/receipt-service";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  if (!hasRequiredSupabaseEnv()) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <SetupNotice />
      </main>
    );
  }

  const user = await requireUser();
  await ensureUserProfile(user.id, user.email);
  const sessionUser = (await getSessionUser()) ?? user;

  return <AppShell userEmail={sessionUser.email}>{children}</AppShell>;
}
