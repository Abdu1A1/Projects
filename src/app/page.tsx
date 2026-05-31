import { redirect } from "next/navigation";

import { SetupNotice } from "@/components/setup-notice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasRequiredSupabaseEnv } from "@/lib/env";
import { getSessionUser } from "@/lib/receipt-service";

export default async function HomePage() {
  if (!hasRequiredSupabaseEnv()) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-12">
        <div className="w-full space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ReceiptAI</CardTitle>
              <CardDescription>
                A mobile-first receipt and invoice saver with AI extraction, search, analytics, and exports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Finish environment setup to enable auth, uploads, and database-backed pages.
              </p>
            </CardContent>
          </Card>
          <SetupNotice />
        </div>
      </main>
    );
  }

  const user = await getSessionUser();
  redirect(user ? "/dashboard" : "/login");
}
