import { redirect } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/types";

const DEMO_USER: SessionUser = {
  id: "demo-user",
  email: "demo@receiptai.app",
  isDemo: true,
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = getServerSupabaseClient();
  if (!supabase) {
    return DEMO_USER;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  await supabase.from("users").upsert({ id: user.id, email: user.email }, { onConflict: "id" });

  return {
    id: user.id,
    email: user.email ?? null,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
