import { createClient } from '@/lib/supabase/server';
import { fetchReceipts, type ReceiptFilter } from '@/lib/receipts/queries';
import { LibraryView } from '@/components/library/library-view';

export const metadata = { title: 'Receipts · ReceiptAI' };
export const dynamic = 'force-dynamic';

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const sp = (k: string) => {
    const v = searchParams[k];
    return typeof v === 'string' ? v : undefined;
  };

  const filter: ReceiptFilter = {
    q: sp('q'),
    category: sp('category'),
    flag: sp('flag'),
    dateFrom: sp('from'),
    dateTo: sp('to'),
    minAmount: sp('min') ? Number(sp('min')) : undefined,
    maxAmount: sp('max') ? Number(sp('max')) : undefined,
    sort: (sp('sort') as any) || 'date',
    order: (sp('order') as any) || 'desc',
  };

  const receipts = await fetchReceipts(supabase, user.id, filter);

  return (
    <div className="container py-6 md:py-10">
      <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Receipts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {receipts.length} {receipts.length === 1 ? 'receipt' : 'receipts'}
          </p>
        </div>
      </header>
      <LibraryView receipts={receipts} initialFilter={filter} />
    </div>
  );
}
