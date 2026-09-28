import { PageHeader } from "@/components/molecules";
import { ChargesBoard } from "@/components/organisms/ChargesBoard";
import { ensureChargeCatalog } from "@/lib/billing";
import { periodLabel } from "@/lib/jalali";
import { prisma } from "@/lib/prisma";
import { getBuilding, requireAdmin } from "@/lib/session";

export default async function ChargeItemsPage() {
  await requireAdmin();
  await ensureChargeCatalog();
  const building = await getBuilding();
  const currency = building?.currency ?? "تومان";

  const [items, units, amenities, draftPeriod] = await Promise.all([
    prisma.chargeItem.findMany({
      include: { expenses: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.unit.findMany({
      orderBy: { number: "asc" },
      select: { id: true, number: true, residentCount: true },
    }),
    prisma.buildingAmenity.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] }),
    prisma.billingPeriod.findFirst({
      where: { fund: "OPERATING", status: "DRAFT" },
      orderBy: [{ jalaliYear: "desc" }, { jalaliMonth: "desc" }],
    }),
  ]);

  const general = items.find((item) => item.kind === "GENERAL");
  const reserve = items.find((item) => item.kind === "RESERVE");
  const occasionals = items.filter((item) => item.kind === "OCCASIONAL" && item.isActive);
  const fines = items.filter((item) => item.kind === "FINE" && item.isActive);
  const levies = draftPeriod
    ? await prisma.occasionalLevy.findMany({
        where: { periodId: draftPeriod.id },
        include: { catalogItem: true },
        orderBy: { occurredAt: "desc" },
      })
    : [];

  return (
    <>
      <PageHeader
        title="شارژ و امکانات"
        description="هزینه‌های سالانه را اینجا تعریف کنید. سهم هر واحد هر ماه هنگام صدور دوره محاسبه می‌شود."
      />
      <ChargesBoard
        currency={currency}
        units={units}
        generalExpenses={
          general?.expenses.map((row) => ({
            kind: row.kind,
            label: row.label,
            amount: String(row.amount),
          })) ?? []
        }
        reserveAmount={reserve ? String(reserve.amount) : "0"}
        occasionals={occasionals.map((item) => ({
          id: item.id,
          name: item.name,
          amount: String(item.amount),
        }))}
        fines={fines.map((item) => ({
          id: item.id,
          name: item.name,
          amount: String(item.amount),
        }))}
        amenities={amenities.map((row) => ({
          id: row.id,
          type: row.type,
          name: row.name,
          monthlyFee: String(row.monthlyFee),
          unitId: row.unitId,
        }))}
        levies={levies.map((row) => ({
          id: row.id,
          unitId: row.unitId,
          amount: String(row.amount),
          note: row.note,
          catalogName: row.catalogItem.name,
          kind: row.catalogItem.kind === "FINE" ? "FINE" : "OCCASIONAL",
        }))}
        draftPeriodLabel={
          draftPeriod ? periodLabel(draftPeriod.jalaliYear, draftPeriod.jalaliMonth) : null
        }
      />
    </>
  );
}
