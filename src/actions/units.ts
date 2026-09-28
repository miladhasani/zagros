"use server";

import { revalidatePath } from "next/cache";
import { UnitRole } from "@prisma/client";
import { z } from "zod";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { toLatinDigits, normalizeLandline } from "@/lib/phone";
import { requireAdmin } from "@/lib/session";

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

function latinNumeric(value: string | undefined) {
  return toLatinDigits(value ?? "").trim().replace(/[^\d.-]/g, "");
}

const unitSchema = z.object({
  number: z.string().min(1, "شماره واحد الزامی است"),
  floor: z.string().optional(),
  areaM2: z.string().optional(),
  parkingCount: z.string().optional(),
  storageCount: z.string().optional(),
  electricityBillId: z.string().optional(),
  gasBillId: z.string().optional(),
  waterBillId: z.string().optional(),
  propertyId: z.string().optional(),
  postalCode: z.string().optional(),
  residentCount: z.string().optional(),
  notes: z.string().optional(),
});

export async function upsertUnitAction(_: unknown, formData: FormData) {
  const actor = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = unitSchema.safeParse({
    number: String(formData.get("number") ?? "").trim(),
    floor: String(formData.get("floor") ?? ""),
    areaM2: String(formData.get("areaM2") ?? ""),
    parkingCount: String(formData.get("parkingCount") ?? ""),
    storageCount: String(formData.get("storageCount") ?? ""),
    electricityBillId: String(formData.get("electricityBillId") ?? ""),
    gasBillId: String(formData.get("gasBillId") ?? ""),
    waterBillId: String(formData.get("waterBillId") ?? ""),
    propertyId: String(formData.get("propertyId") ?? ""),
    postalCode: String(formData.get("postalCode") ?? ""),
    residentCount: String(formData.get("residentCount") ?? "0"),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "داده نامعتبر" };

  const postalCode = emptyToNull(
    toLatinDigits(parsed.data.postalCode ?? "").replace(/\D/g, ""),
  );
  if (postalCode && !/^\d{10}$/.test(postalCode)) {
    return { error: "کد پستی باید ۱۰ رقم باشد" };
  }

  const rawPhoneLines = formData.getAll("phoneLine").map((value) => String(value).trim()).filter(Boolean);
  if (rawPhoneLines.some((value) => !normalizeLandline(value))) {
    return { error: "شماره تلفن ثابت باید ۸ رقم باشد، بدون کد شهر" };
  }
  const phoneLines = [...new Set(rawPhoneLines.map(normalizeLandline))];
  const ownerIds = [...new Set(formData.getAll("ownerUser").map(String).filter(Boolean))];
  const tenantIds = [...new Set(formData.getAll("tenantUser").map(String).filter(Boolean))];

  const floorRaw = latinNumeric(parsed.data.floor);
  const parkingRaw = latinNumeric(parsed.data.parkingCount);
  const storageRaw = latinNumeric(parsed.data.storageCount);
  const areaRaw = latinNumeric(parsed.data.areaM2);
  const residentRaw = latinNumeric(parsed.data.residentCount);
  const floor = floorRaw ? Number(floorRaw) : null;
  const parkingCount = parkingRaw ? Number(parkingRaw) : 0;
  const storageCount = storageRaw ? Number(storageRaw) : 0;
  const residentCount = residentRaw ? Number(residentRaw) : 0;
  if (floor !== null && Number.isNaN(floor)) return { error: "طبقه نامعتبر است" };
  if (Number.isNaN(parkingCount) || Number.isNaN(storageCount)) {
    return { error: "تعداد پارکینگ یا انباری نامعتبر است" };
  }
  if (Number.isNaN(residentCount) || residentCount < 0 || residentCount > 10) {
    return { error: "تعداد نفرات ساکن باید بین ۰ تا ۱۰ باشد" };
  }
  if (areaRaw && Number.isNaN(Number(areaRaw))) return { error: "متراژ نامعتبر است" };

  const data = {
    number: toLatinDigits(parsed.data.number).trim(),
    floor,
    areaM2: areaRaw || null,
    parkingCount,
    storageCount,
    electricityBillId: emptyToNull(toLatinDigits(parsed.data.electricityBillId ?? "")),
    gasBillId: emptyToNull(toLatinDigits(parsed.data.gasBillId ?? "")),
    waterBillId: emptyToNull(toLatinDigits(parsed.data.waterBillId ?? "")),
    phoneLines,
    propertyId: emptyToNull(toLatinDigits(parsed.data.propertyId ?? "")),
    postalCode,
    residentCount,
    notes: emptyToNull(parsed.data.notes),
  };

  const unit = id
    ? await prisma.unit.update({ where: { id }, data })
    : await prisma.unit.create({ data });

  await prisma.userUnitRole.deleteMany({ where: { unitId: unit.id } });
  const roleRows = [
    ...ownerIds.map((userId) => ({ userId, unitId: unit.id, role: UnitRole.OWNER })),
    ...tenantIds.map((userId) => ({ userId, unitId: unit.id, role: UnitRole.TENANT })),
  ];
  if (roleRows.length) {
    await prisma.userUnitRole.createMany({ data: roleRows });
  }

  await writeAudit({
    actorId: actor.id,
    action: id ? "update" : "create",
    entity: "Unit",
    entityId: unit.id,
    after: { number: unit.number, ownerIds, tenantIds },
  });
  revalidatePath("/panel/settings/units");
  revalidatePath("/panel/unit/info");
  revalidatePath("/panel/settings/users");
  return { ok: true, id: unit.id };
}

export async function deleteUnitAction(id: string) {
  const actor = await requireAdmin();
  await prisma.unit.delete({ where: { id } });
  await writeAudit({ actorId: actor.id, action: "delete", entity: "Unit", entityId: id });
  revalidatePath("/panel/settings/units");
  revalidatePath("/panel/unit/info");
}
