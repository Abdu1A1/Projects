import { notFound } from "next/navigation";

import { ReceiptDetailEditor } from "@/components/receipt/receipt-detail-editor";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ReceiptRecord } from "@/types/receipt";

export default async function ReceiptDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = createClient();

  const { data: receiptData } = await supabase
    .from("receipts")
    .select("id,user_id,image_url,raw_text,merchant,date,time,total,tax,currency,payment_method,category,summary,flags,confidence,created_at")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!receiptData) {
    notFound();
  }

  const [{ data: lineItems }, { data: tags }] = await Promise.all([
    supabase.from("line_items").select("id,name,qty,price").eq("receipt_id", params.id).order("name"),
    supabase.from("tags").select("id,label").eq("receipt_id", params.id).order("label"),
  ]);

  const receipt = {
    ...(receiptData as ReceiptRecord),
    line_items: lineItems ?? [],
    tags: tags ?? [],
  };

  return <ReceiptDetailEditor initialReceipt={receipt} />;
}
