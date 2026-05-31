import { notFound } from "next/navigation";

import { ReceiptDetailEditor } from "@/components/detail/receipt-detail-editor";
import { getCustomCategories, getReceiptById, findPossibleDuplicate, requireUser } from "@/lib/receipt-service";

export default async function ReceiptDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const receipt = await getReceiptById(user.id, params.id);

  if (!receipt) {
    notFound();
  }

  const categories = await getCustomCategories(user.id);
  const duplicate = await findPossibleDuplicate(user.id, receipt);

  return (
    <ReceiptDetailEditor
      initialReceipt={receipt}
      duplicateReceipt={duplicate}
      categoryOptions={categories.map((category) => category.name)}
    />
  );
}
