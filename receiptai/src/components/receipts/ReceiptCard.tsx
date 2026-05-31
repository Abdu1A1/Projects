'use client';

import Link from 'next/link';
import { Receipt, FlagType, CATEGORY_COLORS } from '@/types';
import { Badge } from '@/components/ui/badge';
import { FlagBadge } from './FlagBadge';
import { ImageIcon, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface ReceiptCardProps {
  receipt: Receipt;
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
  const formattedDate = receipt.date
    ? format(new Date(receipt.date + 'T00:00:00'), 'MMM d, yyyy')
    : 'No date';

  const formattedTotal = receipt.total != null
    ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: receipt.currency || 'CAD' }).format(receipt.total)
    : 'No total';

  const categoryColor = receipt.category ? CATEGORY_COLORS[receipt.category] : '#94a3b8';
  const flags = (receipt.flags || []) as FlagType[];

  return (
    <Link href={`/receipts/${receipt.id}`}>
      <div className="receipt-card bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md cursor-pointer">
        <div className="flex">
          {/* Thumbnail left */}
          <div className="relative w-24 sm:w-28 flex-shrink-0 bg-gray-100 dark:bg-gray-800 self-stretch min-h-[88px]">
            {receipt.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={receipt.image_url}
                alt={receipt.merchant || 'Receipt'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
            )}
            {receipt.confidence != null && receipt.confidence < 0.7 && (
              <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-yellow-400 rounded-full" title="Low AI confidence" />
            )}
          </div>

          {/* Content right */}
          <div className="flex-1 p-3 min-w-0 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                  {receipt.merchant || 'Unknown Merchant'}
                </h3>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{formattedDate}</span>
                </div>
              </div>
              <p className="font-bold text-gray-900 dark:text-white text-sm flex-shrink-0">{formattedTotal}</p>
            </div>

            <div className="flex flex-wrap items-center gap-1 mt-2">
              {receipt.category && (
                <span
                  className="text-white text-xs font-semibold px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: categoryColor }}
                >
                  {receipt.category}
                </span>
              )}
              {flags.slice(0, 2).map((flag) => (
                <FlagBadge key={flag} flag={flag} size="sm" />
              ))}
              {flags.length > 2 && (
                <Badge variant="outline" className="text-xs text-gray-500">
                  +{flags.length - 2}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
