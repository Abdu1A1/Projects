import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { hasSupabasePublicEnv } from "@/lib/env";

export function getServerSupabaseClient() {
  if (!hasSupabasePublicEnv()) {
    return null;
  }

  const cookieStore = cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot always write cookies; middleware refresh handles that path.
        }
      },
    },
  });
}
