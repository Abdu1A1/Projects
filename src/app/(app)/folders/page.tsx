import { createClient } from '@/lib/supabase/server';
import { FoldersView } from '@/components/folders/folders-view';
import type { Receipt } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Folders · ReceiptAI' };

export default async function FoldersPage({
  searchParams,
}: {
  searchParams: { view?: string; folder?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('receipts')
    .select('id, merchant, total, date, category, currency, image_url, flags')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(1000);

  const { data: customCategories } = await supabase
    .from('categories')
    .select('name')
    .eq('user_id', user.id)
    .eq('is_custom', true);

  const view = (searchParams.view as 'time' | 'merchant') ?? 'time';
  const folder = searchParams.folder;

  return (
    <div className="container py-6 md:py-10">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Folders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse your receipts by time or by merchant.
        </p>
      </header>
      <FoldersView
        receipts={(data as Receipt[]) ?? []}
        view={view}
        folder={folder}
        customCategories={(customCategories ?? []).map((c) => c.name)}
      />
    </div>
  );
}
