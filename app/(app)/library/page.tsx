import { getReceiptsWithFilters } from "@/lib/receipts";
import { createClient } from "@/lib/supabase/server";
import { ExportButtons } from "@/components/library/export-buttons";
import { LibraryFilters } from "@/components/library/library-filters";
import { ReceiptCard } from "@/components/library/receipt-card";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const filters = {
    search: typeof searchParams.search === "string" ? searchParams.search : undefined,
    category:
      typeof searchParams.category === "string" ? searchParams.category : undefined,
    minAmount:
      typeof searchParams.minAmount === "string"
        ? searchParams.minAmount
        : undefined,
    maxAmount:
      typeof searchParams.maxAmount === "string"
        ? searchParams.maxAmount
        : undefined,
    flag: typeof searchParams.flag === "string" ? searchParams.flag : undefined,
    from: typeof searchParams.from === "string" ? searchParams.from : undefined,
    to: typeof searchParams.to === "string" ? searchParams.to : undefined,
    sort: typeof searchParams.sort === "string" ? searchParams.sort : "date_desc",
  };

  const receipts = await getReceiptsWithFilters({
    supabase,
    userId: user!.id,
    filters,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Receipt Library</h1>
          <p className="text-sm text-muted-foreground">
            Search by merchant, tags, or line items with full-text indexing.
          </p>
        </div>
        <ExportButtons receipts={receipts} />
      </div>

      <LibraryFilters />

      {receipts.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-lg font-medium">No receipts yet — tap the camera to add your first one</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {receipts.map((receipt) => (
            <ReceiptCard key={receipt.id} receipt={receipt} />
          ))}
        </div>
      )}
    </div>
  );
}
