import { notFound } from "next/navigation";
import { getReceiptDetail } from "@/lib/receipts";
import { createClient } from "@/lib/supabase/server";
import { ReceiptEditor } from "@/components/detail/receipt-editor";

export const dynamic = "force-dynamic";

export default async function ReceiptDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const detail = await getReceiptDetail({
      supabase,
      userId: user!.id,
      receiptId: params.id,
    });

    return <ReceiptEditor {...detail} />;
  } catch (_error) {
    notFound();
  }
}
