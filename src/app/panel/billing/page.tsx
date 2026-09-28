import { StatementScreen } from "@/components/organisms/StatementScreen";
import { requireAdmin } from "@/lib/session";

export default async function BillingPage() {
  await requireAdmin();
  return (
    <StatementScreen
      fund="OPERATING"
      title="صدور شارژ واحدها"
      description="دوره ماهانه شارژ را بسازید، سهم هر واحد را ببینید و واریزی ثبت کنید."
    />
  );
}
