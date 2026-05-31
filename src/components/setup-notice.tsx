import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasRequiredSupabaseEnv } from "@/lib/env";

export function SetupNotice() {
  if (hasRequiredSupabaseEnv()) {
    return null;
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle>Configure environment variables</CardTitle>
        <CardDescription>
          ReceiptAI needs Supabase, Cloudinary, and Anthropic credentials before auth, uploads, and AI processing can run end to end.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>
          Copy <code className="rounded bg-secondary px-2 py-1 text-foreground">.env.example</code> to{" "}
          <code className="rounded bg-secondary px-2 py-1 text-foreground">.env.local</code> and fill in your keys.
        </p>
        <p>
          After configuring Supabase, run the migration in{" "}
          <Link className="font-medium text-primary" href="https://supabase.com/docs">
            your Supabase project
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
