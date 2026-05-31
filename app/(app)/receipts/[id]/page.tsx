import { notFound } from "next/navigation";
import { ReceiptDetailPage } from "@/components/app/receipt-detail-page";
import { requireUser } from "@/lib/auth";
import { getCategories, getDuplicateReceipt, getReceipt } from "@/lib/data/repository";

export default async function ReceiptDetailRoute({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const [receipt, categories, duplicate] = await Promise.all([
    getReceipt(user.id, params.id),
    getCategories(user.id),
    getDuplicateReceipt(user.id, params.id),
  ]);

  if (!receipt) {
    notFound();
  }

  return <ReceiptDetailPage categories={categories} duplicate={duplicate} receipt={receipt} />;
}
