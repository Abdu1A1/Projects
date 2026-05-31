import { ArchiveView } from "@/components/archive/archive-view";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ReceiptRecord } from "@/types/receipt";

export default async function ArchivePage() {
  const user = await requireUser();
  const supabase = createClient();

  const [{ data: receiptsData }, { data: categoriesData }] = await Promise.all([
    supabase
      .from("receipts")
      .select("id,user_id,image_url,raw_text,merchant,date,time,total,tax,currency,payment_method,category,summary,flags,confidence,created_at")
      .eq("user_id", user.id)
      .order("date", { ascending: false }),
    supabase.from("categories").select("name").eq("user_id", user.id).eq("is_custom", true),
  ]);

  const receipts = (receiptsData ?? []) as ReceiptRecord[];
  const customCategories = (categoriesData ?? []).map((entry) => entry.name);

  return <ArchiveView receipts={receipts} customCategories={customCategories} />;
}
