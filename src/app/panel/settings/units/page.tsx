import { PageHeader } from "@/components/molecules";
import { UnitsBoard } from "@/components/organisms/UnitsBoard";
import type { UnitFormValue } from "@/components/organisms/UnitForm";
import { normalizeLandline } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export default async function UnitsPage() {
  await requireAdmin();
  const [units, users] = await Promise.all([
    prisma.unit.findMany({
      orderBy: { number: "asc" },
      include: { occupants: true },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, phone: true },
    }),
  ]);

  const rows: UnitFormValue[] = units.map((unit) => ({
    id: unit.id,
    number: unit.number,
    floor: unit.floor,
    areaM2: unit.areaM2 ? String(unit.areaM2) : null,
    parkingCount: unit.parkingCount,
    storageCount: unit.storageCount,
    electricityBillId: unit.electricityBillId,
    gasBillId: unit.gasBillId,
    waterBillId: unit.waterBillId,
    phoneLines: unit.phoneLines.map(normalizeLandline).filter(Boolean),
    propertyId: unit.propertyId,
    postalCode: unit.postalCode,
    residentCount: unit.residentCount,
    notes: unit.notes,
    ownerIds: unit.occupants.filter((row) => row.role === "OWNER").map((row) => row.userId),
    tenantIds: unit.occupants.filter((row) => row.role === "TENANT").map((row) => row.userId),
  }));

  return (
    <>
      <PageHeader
        title="واحدها"
        description="مشخصات هر واحد را کامل کنید. مالک و مستاجر از بین کاربران سامانه انتخاب می‌شوند."
      />
      <UnitsBoard units={rows} users={users} />
    </>
  );
}
