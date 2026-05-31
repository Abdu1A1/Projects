import { LibraryPage } from "@/components/app/library-page";
import { requireUser } from "@/lib/auth";
import { getCategories, getFolderData, getReceipts } from "@/lib/data/repository";
import { normalizeFilters } from "@/lib/search";

export default async function ReceiptLibraryPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const user = await requireUser();
  const filters = normalizeFilters(searchParams);
  const [receipts, categories, folderGroups] = await Promise.all([
    getReceipts(user.id, filters),
    getCategories(user.id),
    getFolderData(user.id, filters),
  ]);

  return <LibraryPage categories={categories} filters={filters} folderGroups={folderGroups} receipts={receipts} />;
}
