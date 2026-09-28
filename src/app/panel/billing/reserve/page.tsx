import { StatementScreen } from "@/components/organisms/StatementScreen";
import { requireAdmin } from "@/lib/session";

export default async function ReserveBillingPage() {
  await requireAdmin();
  return (
    <StatementScreen
      fund="RESERVE"
      title="صدور صندوق ذخیره"
      description="دوره ماهانه صندوق ذخیره را بسازید، سهم هر مالک را ببینید و واریزی ثبت کنید."
    />
  );
}
