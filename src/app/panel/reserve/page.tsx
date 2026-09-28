import { ExpenseStatement } from "@/components/organisms/ExpenseStatement";

export default async function ReservePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ExpenseStatement
      fund="RESERVE"
      title="صورت‌حساب هزینه‌های صندوق ذخیره"
      description="هزینه‌هایی که از محل صندوق ذخیره مالکین در این ماه پرداخت شده است. فقط مالکان این صورت‌حساب را می‌بینند."
      printTitle="صورت‌حساب هزینه‌های صندوق ذخیره"
      reportHint="این صورت‌حساب نشان می‌دهد موجودی صندوق ذخیره صرف چه هزینه‌هایی شده است."
      searchParams={searchParams}
    />
  );
}
