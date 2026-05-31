import { NextResponse } from "next/server";

import { ensureUserProfile } from "@/lib/receipt-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    if (data.user) {
      await ensureUserProfile(data.user.id, data.user.email);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
