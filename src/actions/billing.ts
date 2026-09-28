"use server";

import { revalidatePath } from "next/cache";
import { AmenityType, ChargeKind, ExpenseKind, FundType, PeriodStatus } from "@prisma/client";
import { z } from "zod";
import { writeAudit } from "@/lib/audit";
import { ensureChargeCatalog, generatePeriodCharges } from "@/lib/billing";
import { parseMoneyInput } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

function pairsFromForm(formData: FormData, labelName: string, amountName: string) {
  const labels = formData.getAll(labelName).map((value) => String(value).trim());
  const amounts = formData.getAll(amountName).map((value) => parseMoneyInput(String(value)));
  return labels
    .map((label, index) => ({ label, amount: amounts[index] ?? 0 }))
    .filter((row) => row.label);
}

function revalidateCharges() {
  revalidatePath("/panel/settings/charges");
  revalidatePath("/panel/charges");
  revalidatePath("/panel/reserve");
}

export async function saveGeneralExpensesAction(_: unknown, formData: FormData) {
  const actor = await requireAdmin();
  await ensureChargeCatalog();
  const general = await prisma.chargeItem.findFirst({ where: { kind: ChargeKind.GENERAL } });
  if (!general) return { error: "آیتم شارژ عمومی یافت نشد" };

  const constants = pairsFromForm(formData, "constantLabel", "constantAmount");
  const variables = pairsFromForm(formData, "variableLabel", "variableAmount");
  const rows = [
    ...constants.map((row, index) => ({
      chargeItemId: general.id,
      kind: ExpenseKind.CONSTANT,
      label: row.label,
      amount: row.amount,
      sortOrder: index,
    })),
    ...variables.map((row, index) => ({
      chargeItemId: general.id,
      kind: ExpenseKind.VARIABLE,
      label: row.label,
      amount: row.amount,
      sortOrder: index,
    })),
  ];

  await prisma.$transaction([
    prisma.chargeExpense.deleteMany({ where: { chargeItemId: general.id } }),
    ...(rows.length ? [prisma.chargeExpense.createMany({ data: rows })] : []),
  ]);

  await writeAudit({
    actorId: actor.id,
    action: "update",
    entity: "ChargeItem",
    entityId: general.id,
    after: { constants: constants.length, variables: variables.length },
  });
  revalidateCharges();
  return { ok: true };
}

export async function saveReserveAmountAction(_: unknown, formData: FormData) {
  const actor = await requireAdmin();
  await ensureChargeCatalog();
  const reserve = await prisma.chargeItem.findFirst({ where: { kind: ChargeKind.RESERVE } });
  if (!reserve) return { error: "آیتم صندوق مالکین یافت نشد" };

  const amount = parseMoneyInput(String(formData.get("amount") ?? "0"));
  await prisma.chargeItem.update({
    where: { id: reserve.id },
    data: { amount },
  });
  await writeAudit({
    actorId: actor.id,
    action: "update",
    entity: "ChargeItem",
    entityId: reserve.id,
    after: { amount },
  });
  revalidateCharges();
  return { ok: true };
}

function parseLevyKind(raw: string) {
  return raw === ChargeKind.FINE ? ChargeKind.FINE : ChargeKind.OCCASIONAL;
}

export async function upsertOccasionalCatalogAction(_: unknown, formData: FormData) {
  const actor = await requireAdmin();
  const kind = parseLevyKind(String(formData.get("kind") ?? ""));
  const parsed = z
    .object({
      name: z
        .string()
        .trim()
        .min(1, kind === ChargeKind.FINE ? "نام جریمه را وارد کنید" : "نام شارژ موردی را وارد کنید"),
      amount: z.string(),
    })
    .safeParse({
      name: String(formData.get("name") ?? ""),
      amount: String(formData.get("amount") ?? "0"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "داده نامعتبر است" };

  const item = await prisma.chargeItem.create({
    data: {
      name: parsed.data.name,
      kind,
      fund: FundType.OPERATING,
      method: "FIXED",
      amount: parseMoneyInput(parsed.data.amount),
      appliesTo: "ALL",
      sortOrder: kind === ChargeKind.FINE ? 30 : 20,
    },
  });
  await writeAudit({
    actorId: actor.id,
    action: "create",
    entity: "ChargeItem",
    entityId: item.id,
    after: { name: item.name },
  });
  revalidatePath("/panel/settings/charges");
  return { ok: true };
}

export async function deleteOccasionalCatalogAction(id: string) {
  const actor = await requireAdmin();
  const item = await prisma.chargeItem.findUnique({
    where: { id },
    include: { _count: { select: { levies: true } } },
  });
  if (!item || (item.kind !== ChargeKind.OCCASIONAL && item.kind !== ChargeKind.FINE)) {
    return { error: "آیتم یافت نشد" };
  }
  if (item._count.levies > 0) {
    await prisma.chargeItem.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.chargeItem.delete({ where: { id } });
  }
  await writeAudit({ actorId: actor.id, action: "delete", entity: "ChargeItem", entityId: id });
  revalidatePath("/panel/settings/charges");
  return { ok: true };
}

export async function applyOccasionalLevyAction(_: unknown, formData: FormData) {
  const actor = await requireAdmin();
  const catalogItemId = String(formData.get("catalogItemId") ?? "");
  const unitId = String(formData.get("unitId") ?? "");
  const amount = parseMoneyInput(String(formData.get("amount") ?? "0"));
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!catalogItemId || !unitId) return { error: "واحد و نوع شارژ را انتخاب کنید" };

  const catalog = await prisma.chargeItem.findUnique({ where: { id: catalogItemId } });
  if (
    !catalog ||
    (catalog.kind !== ChargeKind.OCCASIONAL && catalog.kind !== ChargeKind.FINE) ||
    !catalog.isActive
  ) {
    return { error: "نوع شارژ نامعتبر است" };
  }

  const period = await prisma.billingPeriod.findFirst({
    where: { fund: FundType.OPERATING, status: PeriodStatus.DRAFT },
    orderBy: [{ jalaliYear: "desc" }, { jalaliMonth: "desc" }],
  });
  if (!period) return { error: "ابتدا یک دوره پیش‌نویس شارژ بسازید" };

  const levy = await prisma.occasionalLevy.create({
    data: {
      catalogItemId,
      unitId,
      periodId: period.id,
      amount: amount || parseMoneyInput(String(catalog.amount)),
      note,
    },
  });
  await generatePeriodCharges(period.id);
  await writeAudit({
    actorId: actor.id,
    action: "create",
    entity: "OccasionalLevy",
    entityId: levy.id,
    after: { unitId, catalogItemId, amount: levy.amount },
  });
  revalidateCharges();
  return { ok: true };
}

export async function deleteOccasionalLevyAction(id: string) {
  const actor = await requireAdmin();
  const levy = await prisma.occasionalLevy.findUnique({
    where: { id },
    include: { period: true },
  });
  if (!levy) return { error: "مورد یافت نشد" };
  if (levy.period.status !== PeriodStatus.DRAFT) {
    return { error: "فقط از دوره پیش‌نویس می‌توان شارژ موردی را حذف کرد" };
  }
  await prisma.occasionalLevy.delete({ where: { id } });
  await generatePeriodCharges(levy.periodId);
  await writeAudit({ actorId: actor.id, action: "delete", entity: "OccasionalLevy", entityId: id });
  revalidateCharges();
  return { ok: true };
}

export async function upsertAmenityAction(_: unknown, formData: FormData) {
  const actor = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = z
    .object({
      name: z.string().trim().min(1, "نام امکان را وارد کنید"),
      type: z.nativeEnum(AmenityType),
      monthlyFee: z.string(),
      unitId: z.string().optional(),
    })
    .safeParse({
      name: String(formData.get("name") ?? ""),
      type: String(formData.get("type") ?? "STORAGE"),
      monthlyFee: String(formData.get("monthlyFee") ?? "0"),
      unitId: String(formData.get("unitId") ?? ""),
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "داده نامعتبر است" };

  const data = {
    name: parsed.data.name,
    type: parsed.data.type,
    monthlyFee: parseMoneyInput(parsed.data.monthlyFee),
    unitId: parsed.data.unitId || null,
  };

  const amenity = id
    ? await prisma.buildingAmenity.update({ where: { id }, data })
    : await prisma.buildingAmenity.create({ data });

  await writeAudit({
    actorId: actor.id,
    action: id ? "update" : "create",
    entity: "BuildingAmenity",
    entityId: amenity.id,
    after: data,
  });
  revalidateCharges();
  return { ok: true };
}

export async function deleteAmenityAction(id: string) {
  const actor = await requireAdmin();
  await prisma.buildingAmenity.delete({ where: { id } });
  await writeAudit({ actorId: actor.id, action: "delete", entity: "BuildingAmenity", entityId: id });
  revalidateCharges();
  return { ok: true };
}

export async function createPeriodAction(fund: FundType, year: number, month: number) {
  const actor = await requireAdmin();
  const existing = await prisma.billingPeriod.findUnique({
    where: { jalaliYear_jalaliMonth_fund: { jalaliYear: year, jalaliMonth: month, fund } },
  });
  if (existing) return { error: "این دوره قبلاً ساخته شده است", id: existing.id };

  const period = await prisma.billingPeriod.create({
    data: { jalaliYear: year, jalaliMonth: month, fund },
  });
  await generatePeriodCharges(period.id);
  await writeAudit({
    actorId: actor.id,
    action: "create",
    entity: "BillingPeriod",
    entityId: period.id,
    after: { year, month, fund },
  });
  revalidatePath(fund === "RESERVE" ? "/panel/billing/reserve" : "/panel/billing");
  return { id: period.id };
}

export async function regeneratePeriodAction(periodId: string) {
  const actor = await requireAdmin();
  await generatePeriodCharges(periodId);
  await writeAudit({ actorId: actor.id, action: "regenerate", entity: "BillingPeriod", entityId: periodId });
  revalidatePath("/panel/billing");
  revalidatePath("/panel/billing/reserve");
}

export async function issuePeriodAction(periodId: string) {
  const actor = await requireAdmin();
  const period = await prisma.billingPeriod.update({
    where: { id: periodId },
    data: { status: PeriodStatus.ISSUED, issuedAt: new Date() },
  });
  await writeAudit({ actorId: actor.id, action: "issue", entity: "BillingPeriod", entityId: periodId });
  revalidatePath("/panel/billing");
  revalidatePath("/panel/billing/reserve");
  revalidatePath("/panel/debts");
  return period;
}

export async function closePeriodAction(periodId: string) {
  const actor = await requireAdmin();
  await prisma.billingPeriod.update({
    where: { id: periodId },
    data: { status: PeriodStatus.CLOSED, closedAt: new Date() },
  });
  await writeAudit({ actorId: actor.id, action: "close", entity: "BillingPeriod", entityId: periodId });
  revalidatePath("/panel/billing");
  revalidatePath("/panel/billing/reserve");
}

export async function overrideLineAction(lineId: string, amount: number) {
  const actor = await requireAdmin();
  const line = await prisma.unitChargeLine.update({
    where: { id: lineId },
    data: { amount, isOverride: true },
    include: { unitCharge: { include: { lines: true } } },
  });
  const total = line.unitCharge.lines.reduce((sum, item) => {
    const value = item.id === lineId ? amount : Number(item.amount);
    return sum + value;
  }, 0);
  await prisma.unitCharge.update({
    where: { id: line.unitChargeId },
    data: { total },
  });
  await writeAudit({
    actorId: actor.id,
    action: "override",
    entity: "UnitChargeLine",
    entityId: lineId,
    after: { amount },
  });
  revalidatePath("/panel/billing");
  revalidatePath("/panel/billing/reserve");
}

export async function updateBuildingAction(_: unknown, formData: FormData) {
  const actor = await requireAdmin();
  if (!actor.isSuperAdmin) return { error: "فقط مدیرکل می‌تواند تنظیمات ساختمان را تغییر دهد" };
  const building = await prisma.building.findFirst();
  if (!building) return { error: "ساختمان یافت نشد" };
  await prisma.building.update({
    where: { id: building.id },
    data: {
      name: String(formData.get("name") ?? "").trim() || building.name,
      address: String(formData.get("address") ?? "").trim() || null,
      currency: String(formData.get("currency") ?? "تومان").trim() || "تومان",
    },
  });
  await writeAudit({ actorId: actor.id, action: "update", entity: "Building", entityId: building.id });
  revalidatePath("/");
  revalidatePath("/panel/settings/building");
  return { ok: true };
}
