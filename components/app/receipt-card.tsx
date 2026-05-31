import Link from "next/link";
import { ArrowUpRight, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FLAG_META } from "@/lib/constants";
import { formatCurrency, formatReceiptDate } from "@/lib/format";
import type { Receipt } from "@/lib/types";

export function ReceiptCard({ receipt }: { receipt: Receipt }) {
  return (
    <Link href={`/receipts/${receipt.id}`}>
      <Card className="overflow-hidden border-border/60 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg">
        <div className="flex min-h-[148px] gap-4 p-4">
          <div className="h-28 w-24 overflow-hidden rounded-2xl bg-muted">
            {receipt.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={receipt.merchant || "Receipt image"} className="h-full w-full object-cover" src={receipt.image_url} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No image</div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold">{receipt.merchant || "Manual review"}</h3>
                  <p className="text-sm text-muted-foreground">{formatReceiptDate(receipt.date)}</p>
                </div>
                <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
              <p className="text-xl font-semibold tracking-tight">{formatCurrency(receipt.total, receipt.currency)}</p>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary/10 text-primary">{receipt.category || "Other"}</Badge>
                {receipt.tags.length > 0 && (
                  <Badge className="bg-secondary/70 text-secondary-foreground">
                    <Tags className="mr-1 h-3 w-3" />
                    {receipt.tags[0].label}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {receipt.flags.map((flag) => {
                  const meta = FLAG_META[flag];
                  return (
                    <Badge className={meta.className} key={flag} title={meta.description}>
                      {meta.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
