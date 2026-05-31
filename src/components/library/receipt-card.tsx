import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FLAG_META } from "@/lib/constants";
import type { Receipt } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function ReceiptCard({ receipt }: { receipt: Receipt }) {
  return (
    <Link href={`/receipts/${receipt.id}`}>
      <Card className="overflow-hidden p-4 transition-transform hover:-translate-y-0.5">
        <div className="flex items-start gap-4">
          <div className="relative h-24 w-24 flex-none overflow-hidden rounded-3xl bg-secondary">
            {receipt.image_url ? (
              <Image
                src={receipt.image_url}
                alt={receipt.merchant ?? "Receipt image"}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{receipt.merchant || "Unknown merchant"}</p>
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>{receipt.date ?? "No date"}</span>
                </div>
              </div>
              <p className="text-base font-semibold">{formatCurrency(receipt.total, receipt.currency ?? "CAD")}</p>
            </div>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
              <Badge variant="accent">{receipt.category || "Other"}</Badge>
              <div className="flex flex-wrap justify-end gap-2">
                {(receipt.flags ?? []).map((flag) => {
                  const meta = FLAG_META[flag];
                  if (!meta) return null;
                  return (
                    <Badge key={flag} className={meta.className}>
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
