"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RECEIPT_CATEGORIES, SORT_OPTIONS } from "@/lib/constants";
import { parseAmountFromQuery } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Filters = {
  search: string;
  category: string;
  minAmount: string;
  maxAmount: string;
  flag: string;
  from: string;
  to: string;
  sort: string;
};

const defaultFilters: Filters = {
  search: "",
  category: "",
  minAmount: "",
  maxAmount: "",
  flag: "",
  from: "",
  to: "",
  sort: "date_desc",
};

export function LibraryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentFilters = useMemo<Filters>(() => {
    return {
      search: searchParams.get("search") ?? defaultFilters.search,
      category: searchParams.get("category") ?? defaultFilters.category,
      minAmount: searchParams.get("minAmount") ?? defaultFilters.minAmount,
      maxAmount: searchParams.get("maxAmount") ?? defaultFilters.maxAmount,
      flag: searchParams.get("flag") ?? defaultFilters.flag,
      from: searchParams.get("from") ?? defaultFilters.from,
      to: searchParams.get("to") ?? defaultFilters.to,
      sort: searchParams.get("sort") ?? defaultFilters.sort,
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<Filters>(currentFilters);

  const applyFilters = () => {
    const next = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;
      next.set(key, value);
    });

    if (filters.search) {
      const inferred = parseAmountFromQuery(filters.search);
      if (inferred.minAmount !== null && !filters.minAmount) {
        next.set("minAmount", String(inferred.minAmount));
      }
      if (inferred.maxAmount !== null && !filters.maxAmount) {
        next.set("maxAmount", String(inferred.maxAmount));
      }
    }

    router.replace(`${pathname}?${next.toString()}`);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    router.replace(pathname);
  };

  return (
    <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2 lg:grid-cols-4">
      <Input
        placeholder="Search (e.g. gas april, over $100, milk)"
        value={filters.search}
        onChange={(event) =>
          setFilters((prev) => ({ ...prev, search: event.target.value }))
        }
      />

      <Select
        value={filters.category}
        onChange={(event) =>
          setFilters((prev) => ({ ...prev, category: event.target.value }))
        }
      >
        <option value="">All categories</option>
        {RECEIPT_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </Select>

      <Select
        value={filters.flag}
        onChange={(event) => setFilters((prev) => ({ ...prev, flag: event.target.value }))}
      >
        <option value="">All flags</option>
        <option value="high_tax">high_tax</option>
        <option value="possible_duplicate">possible_duplicate</option>
        <option value="refund_detected">refund_detected</option>
        <option value="missing_total">missing_total</option>
        <option value="suspicious_charge">suspicious_charge</option>
        <option value="low_confidence">low_confidence</option>
      </Select>

      <Select
        value={filters.sort}
        onChange={(event) => setFilters((prev) => ({ ...prev, sort: event.target.value }))}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <Input
        type="number"
        placeholder="Min amount"
        value={filters.minAmount}
        onChange={(event) =>
          setFilters((prev) => ({ ...prev, minAmount: event.target.value }))
        }
      />
      <Input
        type="number"
        placeholder="Max amount"
        value={filters.maxAmount}
        onChange={(event) =>
          setFilters((prev) => ({ ...prev, maxAmount: event.target.value }))
        }
      />
      <Input
        type="date"
        value={filters.from}
        onChange={(event) => setFilters((prev) => ({ ...prev, from: event.target.value }))}
      />
      <Input
        type="date"
        value={filters.to}
        onChange={(event) => setFilters((prev) => ({ ...prev, to: event.target.value }))}
      />

      <div className="col-span-full flex flex-wrap gap-2">
        <Button type="button" onClick={applyFilters}>
          Apply filters
        </Button>
        <Button type="button" variant="outline" onClick={resetFilters}>
          Reset
        </Button>
      </div>
    </div>
  );
}
