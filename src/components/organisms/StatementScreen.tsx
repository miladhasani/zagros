import { PeriodActions } from "@/components/organisms/PeriodActions";
import { PaymentForm } from "@/components/organisms/PaymentForm";
import { DataTable, StatusBadge } from "@/components/organisms/DataTable";
import { PageHeader } from "@/components/molecules";
import { scopedUnitIds } from "@/lib/access";
import { PERIOD_STATUS_LABEL } from "@/lib/billing";
import { faDigits, faMoney, moneyNumber } from "@/lib/format";
import { periodLabel } from "@/lib/jalali";
import { prisma } from "@/lib/prisma";
import { userWithAccess } from "@/lib/session";
import type { FundType } from "@prisma/client";

export async function StatementScreen({
  fund,
  title,
  description,
}: {
  fund: FundType;
  title: string;
  description: string;
}) {
  const { access, building } = await userWithAccess();
  const currency = building?.currency ?? "تومان";
  const ids = scopedUnitIds(access);
  const periods = await prisma.billingPeriod.findMany({
    where: { fund },
    orderBy: [{ jalaliYear: "desc" }, { jalaliMonth: "desc" }],
    include: {
      charges: {
        where: ids ? { unitId: { in: ids } } : undefined,
        include: { unit: true, lines: true },
        orderBy: { unit: { number: "asc" } },
      },
    },
  });
  const latest = periods[0];
  const units = await prisma.unit.findMany({
    where: ids ? { id: { in: ids } } : undefined,
    orderBy: { number: "asc" },
    select: { id: true, number: true },
  });

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          access.isStaff ? (
            <PeriodActions fund={fund} periodId={latest?.id} status={latest?.status} />
          ) : undefined
        }
      />
      {access.isStaff ? (
        <div className="mb-6">
          <PaymentForm units={units} defaultFund={fund} periodId={latest?.id} lockFund />
        </div>
      ) : null}
      {!latest ? (
        <p className="text-ink-muted">هنوز دوره‌ای ساخته نشده است.</p>
      ) : (
        <div className="grid gap-6">
          <p className="text-sm text-ink-muted">
            دوره جاری: {periodLabel(latest.jalaliYear, latest.jalaliMonth)} —{" "}
            {PERIOD_STATUS_LABEL[latest.status]}
          </p>
          <DataTable
            rows={latest.charges}
            rowKey={(row) => row.id}
            mobileTitle={(row) => `واحد ${row.unit.number}`}
            columns={[
              { key: "unit", header: "واحد", render: (row) => row.unit.number },
              {
                key: "lines",
                header: "اقلام",
                render: (row) =>
                  row.lines.length
                    ? row.lines
                        .map((line) => `${line.label} (${faMoney(moneyNumber(line.amount), currency)})`)
                        .join("، ")
                    : "—",
              },
              {
                key: "total",
                header: "جمع",
                numeric: true,
                render: (row) => faMoney(moneyNumber(row.total), currency),
              },
            ]}
          />
          {periods.length > 1 ? (
            <div>
              <h2 className="mb-3 font-semibold">دوره‌های قبلی</h2>
              <DataTable
                rows={periods.slice(1)}
                rowKey={(row) => row.id}
                mobileTitle={(row) => periodLabel(row.jalaliYear, row.jalaliMonth)}
                columns={[
                  {
                    key: "period",
                    header: "دوره",
                    render: (row) => periodLabel(row.jalaliYear, row.jalaliMonth),
                  },
                  {
                    key: "status",
                    header: "وضعیت",
                    render: (row) => <StatusBadge status={row.status} />,
                  },
                  {
                    key: "count",
                    header: "تعداد واحد",
                    numeric: true,
                    render: (row) => faDigits(row.charges.length),
                  },
                ]}
              />
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
