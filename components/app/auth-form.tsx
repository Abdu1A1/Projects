"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Chrome, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { getAppUrl, hasSupabasePublicEnv } from "@/lib/env";
import { toast } from "sonner";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => searchParams.get("redirectTo") || "/", [searchParams]);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = getBrowserSupabaseClient();
  const authEnabled = hasSupabasePublicEnv();

  const handleEmailAuth = async () => {
    if (!authEnabled || !supabase) {
      toast.info("Supabase env vars are not configured, so ReceiptAI is running in demo mode.");
      router.push("/");
      return;
    }

    try {
      setLoading(true);
      const response =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${getAppUrl()}/auth/callback` } });

      if (response.error) {
        throw response.error;
      }

      toast.success(mode === "login" ? "Signed in." : "Check your inbox to confirm your account.");
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (!authEnabled || !supabase) {
      toast.info("Supabase env vars are not configured, so ReceiptAI is running in demo mode.");
      router.push("/");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getAppUrl()}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      toast.error(error.message);
    }
  };

  return (
    <Card className="border-border/60 bg-card/90 shadow-xl shadow-primary/5 backdrop-blur">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Welcome back" : "Create your account"}</CardTitle>
        <CardDescription>
          Use Supabase Auth for email/password and Google sign-in, or explore the app in demo mode when env vars are missing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div className="grid gap-3">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>

        <Button className="w-full" onClick={handleEmailAuth} disabled={loading || !email || !password} type="button">
          <Mail className="h-4 w-4" />
          {mode === "login" ? "Sign in" : "Sign up"}
        </Button>

        <Button className="w-full" variant="outline" onClick={handleGoogleAuth} type="button">
          <Chrome className="h-4 w-4" />
          Continue with Google
        </Button>

        <div className="rounded-3xl bg-secondary/60 p-4 text-sm text-muted-foreground">
          {authEnabled
            ? "Protected routes and row-level security are enforced when Supabase credentials are configured."
            : "Demo mode is enabled because Supabase env vars are not set. You can still explore the product with sample receipts."}
        </div>

        <button className="text-sm font-medium text-primary" onClick={() => setMode(mode === "login" ? "signup" : "login")} type="button">
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </CardContent>
    </Card>
  );
}
