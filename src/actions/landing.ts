"use server";

import { revalidatePath } from "next/cache";
import { writeAudit } from "@/lib/audit";
import { saveUpload } from "@/lib/files";
import { parseMoneyInput } from "@/lib/format";
import { jalaliDateValue, jalaliMonthValue, parseJalaliDate } from "@/lib/jalali";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function createAnnouncementAction(_: unknown, formData: FormData) {
  const actor = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return { error: "عنوان و متن خبر الزامی است" };
  const item = await prisma.announcement.create({ data: { title, body } });
  await writeAudit({ actorId: actor.id, action: "create", entity: "Announcement", entityId: item.id });
  revalidatePath("/");
  revalidatePath("/panel/settings/landing");
  return { ok: true };
}

export async function deleteAnnouncementAction(id: string) {
  const actor = await requireAdmin();
  await prisma.announcement.delete({ where: { id } });
  await writeAudit({ actorId: actor.id, action: "delete", entity: "Announcement", entityId: id });
  revalidatePath("/");
  revalidatePath("/panel/settings/landing");
}

export async function createUtilityBillAction(_: unknown, formData: FormData) {
  const actor = await requireAdmin();
  const type = String(formData.get("type") ?? "").trim();
  const periodRaw = String(formData.get("periodLabel") ?? "").trim();
  const periodParsed = parseJalaliDate(periodRaw);
  const periodLabel = periodParsed ? jalaliMonthValue(periodParsed) : periodRaw;
  const amountRaw = String(formData.get("amount") ?? "").trim();
  if (!type || !periodLabel) return { error: "نوع قبض و دوره الزامی است" };
  const file = formData.get("file");
  let filePath: string | null = null;
  if (file instanceof File && file.size > 0) {
    filePath = (await saveUpload(file, "public/bills")).rel;
  }
  const item = await prisma.utilityBill.create({
    data: { type, periodLabel, amount: amountRaw ? parseMoneyInput(amountRaw) : null, filePath },
  });
  await writeAudit({ actorId: actor.id, action: "create", entity: "UtilityBill", entityId: item.id });
  revalidatePath("/");
  revalidatePath("/panel/settings/landing");
  return { ok: true };
}

export async function deleteUtilityBillAction(id: string) {
  const actor = await requireAdmin();
  await prisma.utilityBill.delete({ where: { id } });
  await writeAudit({ actorId: actor.id, action: "delete", entity: "UtilityBill", entityId: id });
  revalidatePath("/");
  revalidatePath("/panel/settings/landing");
}

export async function createPlanAction(_: unknown, formData: FormData) {
  const actor = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const targetRaw = String(formData.get("targetDate") ?? "").trim();
  const targetParsed = parseJalaliDate(targetRaw);
  const targetDate = targetParsed ? jalaliDateValue(targetParsed) : targetRaw || null;
  if (!title || !description) return { error: "عنوان و توضیح الزامی است" };
  const item = await prisma.futurePlan.create({
    data: { title, description, targetDate },
  });
  await writeAudit({ actorId: actor.id, action: "create", entity: "FuturePlan", entityId: item.id });
  revalidatePath("/");
  revalidatePath("/panel/settings/landing");
  return { ok: true };
}

export async function deletePlanAction(id: string) {
  const actor = await requireAdmin();
  await prisma.futurePlan.delete({ where: { id } });
  await writeAudit({ actorId: actor.id, action: "delete", entity: "FuturePlan", entityId: id });
  revalidatePath("/");
  revalidatePath("/panel/settings/landing");
}
