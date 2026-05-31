import { Receipt, ShieldCheck, Sparkles } from "lucide-react";
import { AuthForm } from "@/components/app/auth-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Receipt className="h-4 w-4" />
            ReceiptAI
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">Snap, parse, search, and summarize every receipt with one AI workflow.</h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              ReceiptAI combines Supabase Auth, Cloudinary enhancement, and Claude vision extraction to turn raw receipts into a searchable, exportable library.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Sparkles, label: "Single Claude vision pass", text: "OCR, extraction, categorization, and summary in one request." },
              { icon: ShieldCheck, label: "Scoped by auth.uid()", text: "Protected routes and row-level security keep each user isolated." },
              { icon: Receipt, label: "Exports and charts", text: "Dashboard analytics, CSV export, and PDF reporting are included." },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div className="rounded-[1.5rem] border border-border/60 bg-card p-4" key={feature.label}>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-semibold">{feature.label}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.text}</p>
                </div>
              );
            })}
          </div>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
