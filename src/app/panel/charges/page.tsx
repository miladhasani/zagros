import { ExpenseStatement } from "@/components/organisms/ExpenseStatement";

export default async function ChargesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ExpenseStatement
      fund="OPERATING"
      title="صورت‌حساب هزینه‌های شارژ"
      description="هزینه‌هایی که از محل شارژ ساختمان در این ماه پرداخت شده است. مالکان و مستأجران این صورت‌حساب را می‌بینند."
      printTitle="صورت‌حساب هزینه‌های شارژ"
      reportHint="این صورت‌حساب نشان می‌دهد شارژ ماهانه صرف چه هزینه‌هایی شده است."
      searchParams={searchParams}
    />
  );
}
