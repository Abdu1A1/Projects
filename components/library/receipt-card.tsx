import Image from "next/image";
import Link from "next/link";
import { FLAG_META } from "@/lib/constants";
import { currency } from "@/lib/utils";
import type { Receipt } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function ReceiptCard({ receipt }: { receipt: Receipt }) {
  return (
    <Link href={`/receipts/${receipt.id}`}>
      <Card className="group overflow-hidden transition hover:shadow-md">
        <div className="flex gap-3 p-3">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
            {receipt.image_url ? (
              <Image
                src={receipt.image_url}
                alt={receipt.merchant || "Receipt"}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : null}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <p className="truncate font-semibold">{receipt.merchant || "Unknown merchant"}</p>
              <p className="text-sm text-muted-foreground">{receipt.date || "No date"}</p>
            </div>
            <p className="text-lg font-semibold">{currency(receipt.total, receipt.currency ?? "CAD")}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t px-3 py-2">
          <Badge variant="secondary">{receipt.category || "Other"}</Badge>
          <div className="flex flex-wrap justify-end gap-1">
            {(receipt.flags ?? []).map((flag) => {
              const meta = FLAG_META[flag as keyof typeof FLAG_META];
              if (!meta) return null;
              return (
                <Badge className={meta.color} key={flag}>
                  {meta.label}
                </Badge>
              );
            })}
          </div>
        </div>
      </Card>
    </Link>
  );
}
