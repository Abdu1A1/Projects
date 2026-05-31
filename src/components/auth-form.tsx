"use client";

import { useFormState, useFormStatus } from "react-dom";
import { LogIn, Mail, UserPlus } from "lucide-react";

import { loginAction, signInWithGoogleAction, signupAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const initialState = { error: "" };

function SubmitButton({ icon: Icon, label }: { icon: typeof LogIn; label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" type="submit" disabled={pending}>
      <Icon className="mr-2 h-4 w-4" />
      {pending ? "Please wait..." : label}
    </Button>
  );
}

export function AuthForm() {
  const [loginState, loginFormAction] = useFormState(loginAction as never, initialState);
  const [signupState, signupFormAction] = useFormState(signupAction as never, initialState);

  return (
    <Card className="w-full">
      <CardHeader className="space-y-3">
        <Badge variant="accent" className="w-fit">
          AI receipt inbox
        </Badge>
        <CardTitle className="text-2xl">Sign in to ReceiptAI</CardTitle>
        <CardDescription>
          Capture receipts on mobile, auto-categorize them with Claude, then search and export everything later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login">
          <TabsList className="w-full">
            <TabsTrigger className="flex-1" value="login">
              Login
            </TabsTrigger>
            <TabsTrigger className="flex-1" value="signup">
              Sign up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form action={loginFormAction} className="space-y-4">
              <Input name="email" type="email" required placeholder="you@example.com" />
              <Input name="password" type="password" required placeholder="Password" />
              {loginState?.error ? <p className="text-sm text-destructive">{loginState.error}</p> : null}
              <SubmitButton icon={Mail} label="Continue with email" />
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form action={signupFormAction} className="space-y-4">
              <Input name="email" type="email" required placeholder="you@example.com" />
              <Input name="password" type="password" required placeholder="Create a password" />
              {signupState?.error ? <p className="text-sm text-destructive">{signupState.error}</p> : null}
              <SubmitButton icon={UserPlus} label="Create account" />
            </form>
          </TabsContent>
        </Tabs>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form action={signInWithGoogleAction}>
          <Button className="w-full" variant="outline" type="submit">
            <LogIn className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
