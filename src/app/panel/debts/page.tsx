import { PageHeader } from "@/components/molecules";
import { UnitsStatusBoard, type UnitStatusRow } from "@/components/organisms/UnitsStatusBoard";
import { canSeeReserve, scopedUnitIds } from "@/lib/access";
import { AMENITY_TYPE_LABEL } from "@/lib/billing";
import { moneyNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { userWithAccess } from "@/lib/session";
import { displayName } from "@/lib/user";
import { PeriodStatus } from "@prisma/client";

export default async function DebtsPage() {
  const { access, building } = await userWithAccess();
  const currency = building?.currency ?? "تومان";
  const ids = scopedUnitIds(access);
  const showReserve = canSeeReserve(access);

  const units = await prisma.unit.findMany({
    where: ids ? { id: { in: ids } } : undefined,
    orderBy: { number: "asc" },
    include: {
      occupants: { include: { user: true } },
      amenities: true,
      charges: {
        where: { period: { status: { in: [PeriodStatus.ISSUED, PeriodStatus.CLOSED] } } },
        include: { period: true },
      },
      payments: true,
    },
  });

  const rows: UnitStatusRow[] = units.map((unit) => {
    const chargeOps = unit.charges
      .filter((row) => row.period.fund === "OPERATING")
      .reduce((sum, row) => sum + moneyNumber(row.total), 0);
    const chargeRes = unit.charges
      .filter((row) => row.period.fund === "RESERVE")
      .reduce((sum, row) => sum + moneyNumber(row.total), 0);
    const payOps = unit.payments
      .filter((row) => row.fund === "OPERATING")
      .reduce((sum, row) => sum + moneyNumber(row.amount), 0);
    const payRes = unit.payments
      .filter((row) => row.fund === "RESERVE")
      .reduce((sum, row) => sum + moneyNumber(row.amount), 0);
    const remainingOps = chargeOps - payOps;
    const remainingRes = chargeRes - payRes;
    const lastPaid = unit.payments.reduce<Date | null>((latest, payment) => {
      if (!latest || payment.paidAt > latest) return payment.paidAt;
      return latest;
    }, null);

    return {
      id: unit.id,
      number: unit.number,
      floor: unit.floor,
      area: unit.areaM2 != null ? String(unit.areaM2) : null,
      residents: unit.residentCount,
      owners: names(unit.occupants.filter((row) => row.role === "OWNER").map((row) => row.user)),
      tenants: names(unit.occupants.filter((row) => row.role === "TENANT").map((row) => row.user)),
      parking: unit.parkingCount,
      storage: unit.storageCount,
      amenities: unit.amenities
        .map((row) => `${AMENITY_TYPE_LABEL[row.type]} ${row.name}`.trim())
        .join("، "),
      phones: unit.phoneLines.join("، "),
      notes: unit.notes,
      chargeOps,
      payOps,
      remainingOps,
      chargeRes,
      payRes,
      remainingRes,
      remaining: remainingOps + (showReserve ? remainingRes : 0),
      lastPaidAt: lastPaid ? lastPaid.toISOString() : null,
      electricity: unit.electricityBillId,
      gas: unit.gasBillId,
      water: unit.waterBillId,
      propertyId: unit.propertyId,
      postalCode: unit.postalCode,
    };
  });

  return (
    <>
      <div className="print:hidden">
        <PageHeader
          title="وضعیت واحدها"
          description="وضعیت همه واحدها در یک نگاه. ستون‌ها را نشان یا پنهان کنید و در صورت نیاز چاپ یا PDF بگیرید."
        />
      </div>
      <UnitsStatusBoard
        rows={rows}
        currency={currency}
        buildingName={building?.name ?? "ساختمان"}
        printedAt={new Date().toISOString()}
        canSeeReserve={showReserve}
      />
    </>
  );
}

function names(users: { firstName: string; lastName: string }[]) {
  return users.map(displayName).filter(Boolean).join("، ");
}
