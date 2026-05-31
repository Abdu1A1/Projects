import { createClient } from "@/lib/supabase/server";
import { FolderView } from "@/components/folders/folder-view";

export const dynamic = "force-dynamic";

export default async function FoldersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [receiptsRes, categoriesRes] = await Promise.all([
    supabase
      .from("receipts")
      .select("*")
      .eq("user_id", user!.id)
      .order("date", { ascending: false }),
    supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", user!.id)
      .eq("is_custom", true)
      .order("name", { ascending: true }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Folder / Archive View</h1>
      <FolderView
        receipts={receiptsRes.data ?? []}
        customCategories={categoriesRes.data ?? []}
      />
    </div>
  );
}
