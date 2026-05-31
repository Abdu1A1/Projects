import { ArchiveView } from "@/components/archive/archive-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomCategories, getReceipts, requireUser } from "@/lib/receipt-service";

export default async function ArchivePage() {
  const user = await requireUser();
  const [receipts, categories] = await Promise.all([
    getReceipts(user.id),
    getCustomCategories(user.id),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Archive folders</CardTitle>
          <CardDescription>
            Toggle between time-based and merchant-based archive trees, then add your own custom category folders.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
      <ArchiveView
        receipts={receipts}
        customCategories={categories.filter((category) => category.is_custom).map((category) => category.name)}
      />
    </div>
  );
}
