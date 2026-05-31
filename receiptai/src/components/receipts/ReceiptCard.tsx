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
        {/* Thumbnail */}
        <div className="relative h-40 bg-gray-100 dark:bg-gray-800">
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
              <ImageIcon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
          )}
          {/* Category badge */}
          {receipt.category && (
            <div
              className="absolute top-2 left-2 text-white text-xs font-semibold px-2 py-1 rounded-lg"
              style={{ backgroundColor: categoryColor }}
            >
              {receipt.category}
            </div>
          )}
          {/* Confidence indicator */}
          {receipt.confidence != null && receipt.confidence < 0.7 && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full" title="Low AI confidence" />
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                {receipt.merchant || 'Unknown Merchant'}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-bold text-gray-900 dark:text-white text-sm">{formattedTotal}</p>
              {receipt.currency && receipt.currency !== 'CAD' && (
                <p className="text-xs text-gray-500">{receipt.currency}</p>
              )}
            </div>
          </div>

          {/* Flags */}
          {flags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {flags.slice(0, 3).map((flag) => (
                <FlagBadge key={flag} flag={flag} size="sm" />
              ))}
              {flags.length > 3 && (
                <Badge variant="outline" className="text-xs text-gray-500">
                  +{flags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
