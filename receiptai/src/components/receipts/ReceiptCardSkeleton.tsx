import { Skeleton } from '@/components/ui/skeleton';

export function ReceiptCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="flex gap-1 mt-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}
