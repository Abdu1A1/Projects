"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RECEIPT_CATEGORIES } from "@/types/receipt";

function setParam(searchParams: URLSearchParams, key: string, value: string) {
  if (!value) {
    searchParams.delete(key);
    return;
  }
  searchParams.set(key, value);
}

export function LibraryControls() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const values = useMemo(
    () => ({
      q: searchParams.get("q") ?? "",
      category: searchParams.get("category") ?? "",
      from: searchParams.get("from") ?? "",
      to: searchParams.get("to") ?? "",
      min: searchParams.get("min") ?? "",
      max: searchParams.get("max") ?? "",
      flags: searchParams.get("flags") ?? "",
      sort: searchParams.get("sort") ?? "date",
      order: searchParams.get("order") ?? "desc",
    }),
    [searchParams],
  );

  const update = (patch: Partial<typeof values>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([key, value]) => setParam(next, key, value ?? ""));
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-2 xl:grid-cols-4">
      <Input
        placeholder="Search (gas april, milk, over 100)"
        value={values.q}
        onChange={(event) => update({ q: event.target.value })}
      />

      <Select
        value={values.category}
        placeholder="All categories"
        onChange={(event) => update({ category: event.target.value })}
        options={RECEIPT_CATEGORIES.map((category) => ({ label: category, value: category }))}
      />

      <div className="grid grid-cols-2 gap-2">
        <Input type="date" value={values.from} onChange={(event) => update({ from: event.target.value })} />
        <Input type="date" value={values.to} onChange={(event) => update({ to: event.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Input type="number" placeholder="Min" value={values.min} onChange={(event) => update({ min: event.target.value })} />
        <Input type="number" placeholder="Max" value={values.max} onChange={(event) => update({ max: event.target.value })} />
      </div>

      <Input
        placeholder="Flags (comma-separated)"
        value={values.flags}
        onChange={(event) => update({ flags: event.target.value })}
      />

      <Select
        value={values.sort}
        options={[
          { label: "Date", value: "date" },
          { label: "Total", value: "total" },
          { label: "Merchant", value: "merchant" },
          { label: "Category", value: "category" },
        ]}
        onChange={(event) => update({ sort: event.target.value })}
      />

      <Select
        value={values.order}
        options={[
          { label: "Descending", value: "desc" },
          { label: "Ascending", value: "asc" },
        ]}
        onChange={(event) => update({ order: event.target.value })}
      />
    </div>
  );
}
