import Link from 'next/link';
import { ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Receipt, Flag } from '@/lib/types';
import { CATEGORY_COLORS, FLAG_META } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';
import { thumbnailUrl } from '@/lib/cloudinary-url';

export function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const thumb = thumbnailUrl(receipt.image_url, 240);
  const cat = receipt.category ?? 'Other';
  const flags = (receipt.flags ?? []) as Flag[];

  return (
    <Link
      href={`/library/${receipt.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={receipt.merchant ?? 'Receipt'}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">
              {receipt.merchant ?? 'Unknown merchant'}
            </div>
            <div className="text-xs text-muted-foreground">{formatDate(receipt.date)}</div>
          </div>
          <div className="text-right">
            <div className="font-semibold tabular-nums">
              {formatCurrency(receipt.total, receipt.currency ?? 'CAD')}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Badge className={`${CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other} border-transparent`}>
            {cat}
          </Badge>
          <div className="flex flex-wrap gap-1 justify-end">
            {flags.slice(0, 3).map((f) => {
              const meta = FLAG_META[f];
              if (!meta) return null;
              return (
                <span
                  key={f}
                  title={meta.description}
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}
                >
                  {meta.label}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </Link>
  );
}
