import { DashboardPage } from "@/components/app/dashboard-page";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/repository";

export default async function HomePage() {
  const user = await requireUser();
  const { receipts, stats, monthlySummary } = await getDashboardData(user.id);

  return <DashboardPage monthlySummary={monthlySummary} receipts={receipts} stats={stats} />;
}
