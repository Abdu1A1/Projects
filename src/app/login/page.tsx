import { AuthForm } from "@/components/auth-form";
import { SetupNotice } from "@/components/setup-notice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <section className="space-y-6">
        <Badge variant="accent" className="w-fit">
          ReceiptAI
        </Badge>
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Save every receipt, invoice, and refund without manual entry.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Upload batches, review AI extraction, search by merchant or item, then export your records as CSV or a monthly PDF.
          </p>
        </div>
        <Card className="bg-accent/70">
          <CardContent className="grid gap-3 p-6 text-sm text-accent-foreground sm:grid-cols-3">
            <div>
              <p className="font-medium">Fast capture</p>
              <p className="text-muted-foreground">Camera-first on mobile, drag-and-drop on desktop.</p>
            </div>
            <div>
              <p className="font-medium">Smart review</p>
              <p className="text-muted-foreground">Confidence banners, duplicate compare, and inline edits.</p>
            </div>
            <div>
              <p className="font-medium">Analytics</p>
              <p className="text-muted-foreground">Category charts, merchant trends, CSV, and PDF export.</p>
            </div>
          </CardContent>
        </Card>
        <SetupNotice />
      </section>

      <section className="mx-auto w-full max-w-lg">
        <AuthForm />
      </section>
    </main>
  );
}
