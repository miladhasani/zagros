import { DataTable } from "@/components/organisms/DataTable";
import { PageHeader, StatCard } from "@/components/molecules";
import { unitBalance } from "@/lib/billing";
import { DateSpan } from "@/components/atoms";
import { faMoney, moneyNumber } from "@/lib/format";
import { periodLabel } from "@/lib/jalali";
import { prisma } from "@/lib/prisma";
import { userWithAccess } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function MyChargePage() {
  const { access, building } = await userWithAccess();
  if (!access.unitIds.length) redirect("/panel/debts");
  const currency = building?.currency ?? "تومان";
  const unitId = access.unitIds[0];
  const [balance, charges, payments] = await Promise.all([
    unitBalance(unitId, "OPERATING"),
    prisma.unitCharge.findMany({
      where: { unitId, period: { fund: "OPERATING" } },
      include: { period: true, lines: true },
      orderBy: [{ period: { jalaliYear: "desc" } }, { period: { jalaliMonth: "desc" } }],
    }),
    prisma.payment.findMany({
      where: { unitId, fund: "OPERATING" },
      orderBy: { paidAt: "desc" },
    }),
  ]);

  return (
    <>
      <PageHeader title="شارژ واحد من" description="صورت‌حساب و واریزی‌های شارژ واحد شما." />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="شارژ صادرشده" value={faMoney(balance.charged, currency)} />
        <StatCard label="پرداخت‌شده" value={faMoney(balance.paid, currency)} tone="success" />
        <StatCard
          label="مانده"
          value={faMoney(balance.remaining, currency)}
          tone={balance.remaining > 0 ? "danger" : "success"}
        />
      </div>
      <h2 className="mb-3 font-semibold">صورت‌حساب‌ها</h2>
      <DataTable
        rows={charges}
        rowKey={(row) => row.id}
        mobileTitle={(row) => periodLabel(row.period.jalaliYear, row.period.jalaliMonth)}
        columns={[
          {
            key: "period",
            header: "دوره",
            render: (row) => periodLabel(row.period.jalaliYear, row.period.jalaliMonth),
          },
          {
            key: "total",
            header: "مبلغ",
            numeric: true,
            render: (row) => faMoney(moneyNumber(row.total), currency),
          },
        ]}
      />
      <h2 className="mt-8 mb-3 font-semibold">واریزی‌ها</h2>
      <DataTable
        rows={payments}
        rowKey={(row) => row.id}
        emptyTitle="واریزی ثبت نشده"
        mobileTitle={(row) => <DateSpan value={row.paidAt} />}
        columns={[
          { key: "date", header: "تاریخ", render: (row) => <DateSpan value={row.paidAt} /> },
          {
            key: "amount",
            header: "مبلغ",
            numeric: true,
            render: (row) => faMoney(row.amount, currency),
          },
          { key: "note", header: "توضیح", render: (row) => row.note ?? "—" },
        ]}
      />
    </>
  );
}
