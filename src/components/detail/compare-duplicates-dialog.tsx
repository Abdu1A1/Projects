"use client";

import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Receipt } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

function ReceiptPreview({ receipt, title }: { receipt: Partial<Receipt>; title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-secondary">
          {receipt.image_url ? (
            <Image src={receipt.image_url} alt={receipt.merchant ?? title} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
          )}
        </div>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Merchant</dt>
            <dd className="font-medium">{receipt.merchant ?? "Unknown"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Date</dt>
            <dd>{receipt.date ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Total</dt>
            <dd>{formatCurrency(receipt.total ?? null, receipt.currency ?? "CAD")}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Category</dt>
            <dd>{receipt.category ?? "—"}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

export function CompareDuplicatesDialog({
  currentReceipt,
  duplicateReceipt,
}: {
  currentReceipt: Receipt;
  duplicateReceipt: Partial<Receipt> | null;
}) {
  if (!duplicateReceipt) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Compare</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Possible duplicate comparison</DialogTitle>
          <DialogDescription>
            Same merchant and total found within 24 hours. Compare the two receipts side by side.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <ReceiptPreview receipt={currentReceipt} title="Current receipt" />
          <ReceiptPreview receipt={duplicateReceipt} title="Possible duplicate" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
