'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ReceiptWithDetails } from '@/types';
import { Loader2, ImageIcon } from 'lucide-react';
import { format } from 'date-fns';

interface CompareModalProps {
  receiptId: string;
  open: boolean;
  onClose: () => void;
}

function ReceiptPanel({ receipt, label }: { receipt: ReceiptWithDetails; label: string }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden aspect-[3/4] mb-3">
        {receipt.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={receipt.image_url} alt="Receipt" className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-gray-400" />
          </div>
        )}
      </div>
      <div className="space-y-1 text-sm">
        <p className="font-semibold text-gray-900 dark:text-white">{receipt.merchant || 'Unknown'}</p>
        <p className="text-gray-600 dark:text-gray-400">
          {receipt.date ? format(new Date(receipt.date + 'T00:00:00'), 'MMM d, yyyy') : 'No date'}
          {receipt.time ? ` at ${receipt.time}` : ''}
        </p>
        <p className="font-bold text-lg">${receipt.total?.toFixed(2) ?? '—'}</p>
        <p className="text-gray-500">{receipt.category || 'Uncategorized'}</p>
      </div>
    </div>
  );
}

export function CompareModal({ receiptId, open, onClose }: CompareModalProps) {
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<ReceiptWithDetails | null>(null);
  const [duplicates, setDuplicates] = useState<ReceiptWithDetails[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    fetch(`/api/receipts/${receiptId}/duplicates`)
      .then((r) => r.json())
      .then((d) => {
        setCurrent(d.receipt);
        setDuplicates(d.duplicates || []);
        setSelectedIndex(0);
      })
      .finally(() => setLoading(false));
  }, [open, receiptId]);

  const duplicate = duplicates[selectedIndex];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compare Possible Duplicate</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : !current || duplicates.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">No matching duplicates found within 24 hours.</p>
        ) : (
          <>
            {duplicates.length > 1 && (
              <div className="flex gap-2 mb-4">
                {duplicates.map((_, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={selectedIndex === i ? 'default' : 'outline'}
                    onClick={() => setSelectedIndex(i)}
                  >
                    Match {i + 1}
                  </Button>
                ))}
              </div>
            )}
            <div className="flex flex-col md:flex-row gap-6">
              <ReceiptPanel receipt={current} label="This Receipt" />
              <ReceiptPanel receipt={duplicate} label="Suspected Duplicate" />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
