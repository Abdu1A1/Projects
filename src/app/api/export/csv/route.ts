import { NextResponse } from "next/server";

import { generateReceiptCsv } from "@/lib/export";
import { parseSearchFilters } from "@/lib/query-parser";
import { getReceipts } from "@/lib/receipt-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams.entries());
  const receipts = await getReceipts(user.id, parseSearchFilters(searchParams));
  const csv = generateReceiptCsv(receipts);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="receipts-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
