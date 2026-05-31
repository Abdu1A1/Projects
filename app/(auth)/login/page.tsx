import Link from "next/link";
import { loginAction, signInWithGoogleAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back to ReceiptAI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={loginAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button className="w-full" type="submit">
              Log in
            </Button>
          </form>

          <form action={signInWithGoogleAction}>
            <Button className="w-full" type="submit" variant="outline">
              Continue with Google
            </Button>
          </form>

          <p className="text-sm text-muted-foreground">
            No account yet?{" "}
            <Link href="/signup" className="text-primary underline underline-offset-4">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
