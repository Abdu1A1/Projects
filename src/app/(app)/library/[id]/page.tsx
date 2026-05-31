import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchReceiptById, findDuplicate } from '@/lib/receipts/queries';
import { ReceiptDetail } from '@/components/receipt/receipt-detail';

export const dynamic = 'force-dynamic';

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const receipt = await fetchReceiptById(supabase, user.id, params.id);
  if (!receipt) notFound();

  const duplicate = (receipt.flags ?? []).includes('possible_duplicate')
    ? await findDuplicate(supabase, user.id, receipt)
    : null;

  return (
    <div className="container py-6 md:py-10">
      <ReceiptDetail receipt={receipt} duplicate={duplicate} />
    </div>
  );
}
