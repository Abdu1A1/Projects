import { CATEGORY_OPTIONS, FLAG_META } from "@/lib/constants";
import type { ReceiptFilters } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function FilterSidebar({ filters }: { filters: ReceiptFilters }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <Input defaultValue={filters.query} name="q" placeholder="Search merchant, item, or tag" />
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <select
              name="category"
              defaultValue={filters.category ?? ""}
              className="flex h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm"
            >
              <option value="">All categories</option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start date</label>
              <Input type="date" name="start" defaultValue={filters.startDate} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End date</label>
              <Input type="date" name="end" defaultValue={filters.endDate} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum amount</label>
              <Input type="number" step="0.01" name="min" defaultValue={filters.minAmount} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Maximum amount</label>
              <Input type="number" step="0.01" name="max" defaultValue={filters.maxAmount} placeholder="500.00" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Flag</label>
            <select
              name="flag"
              defaultValue={filters.flag ?? ""}
              className="flex h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm"
            >
              <option value="">All flags</option>
              {Object.entries(FLAG_META).map(([value, meta]) => (
                <option key={value} value={value}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort by</label>
              <select
                name="sort"
                defaultValue={filters.sort ?? "date"}
                className="flex h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm"
              >
                <option value="date">Date</option>
                <option value="total">Total</option>
                <option value="merchant">Merchant</option>
                <option value="category">Category</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Order</label>
              <select
                name="order"
                defaultValue={filters.order ?? "desc"}
                className="flex h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1" type="submit">
              Apply filters
            </Button>
            <Button asChild className="flex-1" variant="outline">
              <a href="/library">Reset</a>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
