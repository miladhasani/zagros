"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { UnitRole } from "@prisma/client";
import { z } from "zod";
import { writeAudit } from "@/lib/audit";
import { randomPassword } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import {
  collectCardNumbers,
  collectMobiles,
  displayName,
  isValidNationalId,
  normalizeNationalId,
} from "@/lib/user";

const userSchema = z.object({
  firstName: z.string().trim(),
  lastName: z.string().trim().min(1, "نام خانوادگی را وارد کنید"),
  nationalId: z.string().optional(),
  isAdmin: z.boolean(),
});

export async function upsertUserAction(_: unknown, formData: FormData) {
  const actor = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = userSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    nationalId: String(formData.get("nationalId") ?? ""),
    isAdmin: formData.get("isAdmin") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "داده نامعتبر است" };
  }

  const phones = collectMobiles(formData);
  if (!phones.length) return { error: "حداقل یک شماره موبایل لازم است" };
  const cardNumbers = collectCardNumbers(formData);

  const nationalId = normalizeNationalId(parsed.data.nationalId ?? "");
  if (nationalId && !isValidNationalId(nationalId)) {
    return { error: "کد ملی معتبر نیست" };
  }

  const existingPhone = await prisma.user.findFirst({
    where: {
      OR: [{ phone: { in: phones } }, { phones: { hasSome: phones } }],
      ...(id ? { NOT: { id } } : {}),
    },
    select: { id: true },
  });
  if (existingPhone) return { error: "این شماره قبلاً ثبت شده است" };

  if (nationalId) {
    const existingNationalId = await prisma.user.findFirst({
      where: { nationalId, ...(id ? { NOT: { id } } : {}) },
      select: { id: true },
    });
    if (existingNationalId) return { error: "این کد ملی قبلاً ثبت شده است" };
  }

  const ownerUnits = [...new Set(formData.getAll("ownerUnit").map(String).filter(Boolean))];
  const tenantUnits = [...new Set(formData.getAll("tenantUnit").map(String).filter(Boolean))];
  const roleRows = (userId: string) => [
    ...ownerUnits.map((unitId) => ({ userId, unitId, role: UnitRole.OWNER })),
    ...tenantUnits.map((unitId) => ({ userId, unitId, role: UnitRole.TENANT })),
  ];

  if (id) {
    const current = await prisma.user.findUnique({ where: { id } });
    if (!current) return { error: "کاربر یافت نشد" };

    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        phone: phones[0],
        phones,
        nationalId,
        cardNumbers,
        isAdmin: current.isSuperAdmin ? true : parsed.data.isAdmin,
      },
    });

    await prisma.userUnitRole.deleteMany({ where: { userId: user.id } });
    const rows = roleRows(user.id);
    if (rows.length) await prisma.userUnitRole.createMany({ data: rows });

    await writeAudit({
      actorId: actor.id,
      action: "update",
      entity: "User",
      entityId: user.id,
      before: {
        firstName: current.firstName,
        lastName: current.lastName,
        phone: current.phone,
        phones: current.phones,
        nationalId: current.nationalId,
        cardNumbers: current.cardNumbers,
        isAdmin: current.isAdmin,
      },
      after: {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        phones: user.phones,
        nationalId: user.nationalId,
        cardNumbers: user.cardNumbers,
        isAdmin: user.isAdmin,
      },
    });
    revalidatePath("/panel/settings/users");
    revalidatePath("/panel/settings/units");
    return { ok: true, name: displayName(user) };
  }

  const temp = randomPassword();
  const user = await prisma.user.create({
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: phones[0],
      phones,
      nationalId,
      cardNumbers,
      isAdmin: parsed.data.isAdmin,
      mustSetPassword: true,
      passwordHash: await hash(temp, 10),
    },
  });

  const rows = roleRows(user.id);
  if (rows.length) await prisma.userUnitRole.createMany({ data: rows });

  await writeAudit({
    actorId: actor.id,
    action: "create",
    entity: "User",
    entityId: user.id,
    after: {
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      nationalId: user.nationalId,
    },
  });
  revalidatePath("/panel/settings/users");
  revalidatePath("/panel/settings/units");
  return { password: temp, name: displayName(user) };
}

export async function toggleUserAction(userId: string) {
  const actor = await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "کاربر یافت نشد" };
  if (user.isSuperAdmin) return { error: "حساب مدیرکل قابل غیرفعال‌سازی نیست" };
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });
  await writeAudit({
    actorId: actor.id,
    action: "toggle",
    entity: "User",
    entityId: userId,
    before: { isActive: user.isActive },
    after: { isActive: !user.isActive },
  });
  revalidatePath("/panel/settings/users");
}

export async function resetUserPasswordAction(userId: string) {
  const actor = await requireAdmin();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "کاربر یافت نشد" };
  const temp = randomPassword();
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hash(temp, 10), mustSetPassword: true },
  });
  await writeAudit({
    actorId: actor.id,
    action: "reset_password",
    entity: "User",
    entityId: userId,
  });
  revalidatePath("/panel/settings/users");
  return { password: temp, name: displayName(user) };
}
