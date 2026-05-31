import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth";

import type { ReactNode } from "react";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  await requireUser();
  return <AppShell>{children}</AppShell>;
}
