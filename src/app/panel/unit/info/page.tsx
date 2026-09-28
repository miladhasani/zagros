import { Card } from "@/components/atoms";
import { PageHeader } from "@/components/molecules";
import { normalizeLandline } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/user";
import { userWithAccess } from "@/lib/session";
import { redirect } from "next/navigation";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-left">{value}</dd>
    </div>
  );
}

export default async function MyUnitInfoPage() {
  const { access } = await userWithAccess();
  if (!access.unitIds.length) redirect("/panel/debts");
  const units = await prisma.unit.findMany({
    where: { id: { in: access.unitIds } },
    include: { occupants: { include: { user: true } } },
    orderBy: { number: "asc" },
  });

  return (
    <>
      <PageHeader title="اطلاعات واحد من" />
      <div className="grid gap-4 md:grid-cols-2">
        {units.map((unit) => {
          const owners = unit.occupants.filter((row) => row.role === "OWNER");
          const tenants = unit.occupants.filter((row) => row.role === "TENANT");
          return (
            <Card key={unit.id}>
              <h2 className="text-lg font-semibold">واحد {unit.number}</h2>
              <dl className="mt-4 grid gap-2 text-sm">
                <Row label="شماره واحد" value={unit.number} />
                <Row label="طبقه" value={unit.floor != null ? String(unit.floor) : "—"} />
                <Row label="متراژ" value={unit.areaM2 ? String(unit.areaM2) : "—"} />
                <Row label="تعداد پارکینگ" value={String(unit.parkingCount)} />
                <Row label="تعداد انباری" value={String(unit.storageCount)} />
                <Row label="شناسه قبض برق" value={unit.electricityBillId ?? "—"} />
                <Row label="شناسه قبض گاز" value={unit.gasBillId ?? "—"} />
                <Row label="شناسه قبض آب" value={unit.waterBillId ?? "—"} />
                <Row
                  label="مالک"
                  value={owners.length ? owners.map((row) => displayName(row.user)).join("، ") : "—"}
                />
                <Row
                  label="مستاجر"
                  value={tenants.length ? tenants.map((row) => displayName(row.user)).join("، ") : "—"}
                />
                <Row
                  label="خطوط تلفن"
                  value={
                    unit.phoneLines.map(normalizeLandline).filter(Boolean).join("، ") || "—"
                  }
                />
                <Row label="شماره شناسایی ملک" value={unit.propertyId ?? "—"} />
                <Row label="کد پستی ملک" value={unit.postalCode ?? "—"} />
                <Row
                  label="تعداد نفرات ساکن"
                  value={unit.residentCount === 0 ? "۰ (خالی)" : String(unit.residentCount)}
                />
                <Row label="یادداشت" value={unit.notes ?? "—"} />
              </dl>
            </Card>
          );
        })}
      </div>
    </>
  );
}
