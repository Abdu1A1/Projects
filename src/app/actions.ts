"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasRequiredSupabaseEnv } from "@/lib/env";
import { addCustomCategory, ensureUserProfile, requireUser } from "@/lib/receipt-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(
  _prevState: { error?: string },
  formData: FormData,
) {
  if (!hasRequiredSupabaseEnv()) {
    return { error: "Supabase environment variables are missing." };
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signupAction(
  _prevState: { error?: string },
  formData: FormData,
) {
  if (!hasRequiredSupabaseEnv()) {
    return { error: "Supabase environment variables are missing." };
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await ensureUserProfile(data.user.id, data.user.email);
  }

  redirect("/dashboard");
}

export async function signInWithGoogleAction() {
  if (!hasRequiredSupabaseEnv()) {
    return { error: "Supabase environment variables are missing." };
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect(data.url);
}

export async function signOutAction() {
  if (hasRequiredSupabaseEnv()) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}

export async function createCustomCategoryAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Category name is required." };
  }

  await addCustomCategory(user.id, name);

  revalidatePath("/archive");
  revalidatePath("/library");
  revalidatePath(`/receipts`);

  return { success: true };
}
