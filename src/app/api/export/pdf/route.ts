import { renderToBuffer } from "@react-pdf/renderer";
import { startOfMonth, endOfMonth } from "date-fns";

import { ReceiptReport } from "@/components/pdf/receipt-report";
import { hasRequiredSupabaseEnv } from "@/lib/env";
import { getDashboardData, getReceipts } from "@/lib/receipt-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!hasRequiredSupabaseEnv()) {
    return new Response(JSON.stringify({ error: "Supabase is not configured." }), { status: 503 });
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const [dashboard, receipts] = await Promise.all([
    getDashboardData(user.id),
    getReceipts(user.id, {
      startDate: startOfMonth(new Date()).toISOString().slice(0, 10),
      endDate: endOfMonth(new Date()).toISOString().slice(0, 10),
      sort: "date",
      order: "desc",
    }),
  ]);

  const pdf = await renderToBuffer(
    ReceiptReport({
      summary: dashboard.aiSummary,
      receipts,
    }),
  );

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="receiptai-report-${new Date().toISOString().slice(0, 7)}.pdf"`,
    },
  });
}
