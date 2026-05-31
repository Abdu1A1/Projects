import { Download, Search } from "lucide-react";

import { FilterSidebar } from "@/components/library/filter-sidebar";
import { ReceiptCard } from "@/components/library/receipt-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { parseSearchFilters } from "@/lib/query-parser";
import { getReceipts, requireUser } from "@/lib/receipt-service";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const user = await requireUser();
  const filters = parseSearchFilters(searchParams);
  const receipts = await getReceipts(user.id, filters);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside>
        <FilterSidebar filters={filters} />
      </aside>

      <section className="space-y-4">
        <Card>
          <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Receipt library</CardTitle>
              <CardDescription>
                Search across merchants, line items, and tags with URL-synced filters.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <a href={`/api/export/csv?${new URLSearchParams(
                  Object.entries(searchParams).flatMap(([key, value]) =>
                    typeof value === "string" ? [[key, value]] : Array.isArray(value) ? value.map((item) => [key, item]) : [],
                  ),
                ).toString()}`}>
                  <Download className="mr-2 h-4 w-4" />
                  CSV
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="/api/export/pdf">
                  <Download className="mr-2 h-4 w-4" />
                  PDF report
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {filters.query ? <Badge variant="outline">Query: {filters.query}</Badge> : null}
              {filters.category ? <Badge variant="outline">Category: {filters.category}</Badge> : null}
              {filters.flag ? <Badge variant="outline">Flag: {filters.flag}</Badge> : null}
              {typeof filters.minAmount === "number" ? <Badge variant="outline">Min: {filters.minAmount}</Badge> : null}
              {typeof filters.maxAmount === "number" ? <Badge variant="outline">Max: {filters.maxAmount}</Badge> : null}
            </div>
          </CardContent>
        </Card>

        {receipts.length ? (
          <div className="receipt-grid">
            {receipts.map((receipt) => (
              <ReceiptCard key={receipt.id} receipt={receipt} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
              <div className="rounded-full bg-primary/10 p-4 text-primary">
                <Search className="h-7 w-7" />
              </div>
              <div>
                <p className="text-lg font-medium">No receipts found</p>
                <p className="text-sm text-muted-foreground">
                  No receipts yet — tap the camera to add your first one, or adjust the current filters.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
