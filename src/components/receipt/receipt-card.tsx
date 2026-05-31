import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FLAG_STYLES } from "@/lib/constants";
import { currency, formatDate } from "@/lib/utils";
import type { ReceiptRecord } from "@/types/receipt";

export function ReceiptCard({ receipt }: { receipt: ReceiptRecord }) {
  return (
    <Link href={`/receipts/${receipt.id}`}>
      <Card className="flex gap-3 p-3 transition hover:border-sky-300">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
          {receipt.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={receipt.image_url} alt={receipt.merchant ?? "Receipt"} className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{receipt.merchant ?? "Unknown merchant"}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(receipt.date)}</p>
            </div>
            <p className="text-sm font-semibold">{currency(receipt.total, receipt.currency ?? "CAD")}</p>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <Badge variant="secondary">{receipt.category ?? "Other"}</Badge>
            <div className="flex flex-wrap justify-end gap-1">
              {receipt.flags?.map((flag) => {
                const style = FLAG_STYLES[flag];
                if (!style) {
                  return null;
                }

                return (
                  <Badge key={flag} className={style.className}>
                    {style.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
