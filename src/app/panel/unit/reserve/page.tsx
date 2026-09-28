import { DataTable } from "@/components/organisms/DataTable";
import { PageHeader, StatCard } from "@/components/molecules";
import { unitBalance } from "@/lib/billing";
import { DateSpan } from "@/components/atoms";
import { faMoney, moneyNumber } from "@/lib/format";
import { periodLabel } from "@/lib/jalali";
import { prisma } from "@/lib/prisma";
import { userWithAccess } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function MyReservePage() {
  const { access, building } = await userWithAccess();
  if (!access.roles.has("OWNER")) redirect("/panel/unit/charge");
  const currency = building?.currency ?? "تومان";
  const unitId = access.ownerUnitIds[0];
  if (!unitId) redirect("/panel/unit/charge");
  const [balance, charges, payments] = await Promise.all([
    unitBalance(unitId, "RESERVE"),
    prisma.unitCharge.findMany({
      where: { unitId, period: { fund: "RESERVE" } },
      include: { period: true },
      orderBy: [{ period: { jalaliYear: "desc" } }, { period: { jalaliMonth: "desc" } }],
    }),
    prisma.payment.findMany({
      where: { unitId, fund: "RESERVE" },
      orderBy: { paidAt: "desc" },
    }),
  ]);

  return (
    <>
      <PageHeader title="صندوق ذخیره واحد من" />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="بدهکار" value={faMoney(balance.charged, currency)} />
        <StatCard label="واریزی" value={faMoney(balance.paid, currency)} tone="success" />
        <StatCard
          label="مانده"
          value={faMoney(balance.remaining, currency)}
          tone={balance.remaining > 0 ? "danger" : "success"}
        />
      </div>
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
        ]}
      />
    </>
  );
}
