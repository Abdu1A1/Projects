import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container py-6 md:py-10 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-20 w-full" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-1" />
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80 lg:col-span-3" />
      </div>
    </div>
  );
}
