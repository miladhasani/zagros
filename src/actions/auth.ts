"use server";

import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  collectCardNumbers,
  collectMobiles,
  isValidNationalId,
  normalizeNationalId,
} from "@/lib/user";
import { getSessionUser } from "@/lib/session";

const passwordSchema = z
  .string()
  .min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد");

export async function setPasswordAction(_: unknown, formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "رمز نامعتبر است" };
  }
  if (password !== confirm) return { error: "تکرار رمز عبور مطابقت ندارد" };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hash(password, 10), mustSetPassword: false },
  });

  redirect("/panel");
}

export async function changePasswordAction(_: unknown, formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const current = String(formData.get("current") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current) return { error: "رمز فعلی را وارد کنید" };

  const matches = await compare(current, user.passwordHash);
  if (!matches) return { error: "رمز فعلی نادرست است" };

  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "رمز نامعتبر است" };
  }
  if (password !== confirm) return { error: "تکرار رمز عبور مطابقت ندارد" };
  if (await compare(password, user.passwordHash)) {
    return { error: "رمز جدید باید با رمز فعلی متفاوت باشد" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hash(password, 10), mustSetPassword: false },
  });
  await writeAudit({
    actorId: user.id,
    action: "change_password",
    entity: "User",
    entityId: user.id,
  });
  revalidatePath("/panel/account/password");
  return { ok: true };
}

const profileSchema = z.object({
  firstName: z.string().trim().min(1, "نام را وارد کنید"),
  lastName: z.string().trim().min(1, "نام خانوادگی را وارد کنید"),
  nationalId: z.string().optional(),
});

export async function updateProfileAction(_: unknown, formData: FormData) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const parsed = profileSchema.safeParse({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    nationalId: String(formData.get("nationalId") ?? ""),
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

  const taken = await prisma.user.findFirst({
    where: {
      OR: [{ phone: { in: phones } }, { phones: { hasSome: phones } }],
      NOT: { id: user.id },
    },
    select: { id: true },
  });
  if (taken) return { error: "این شماره موبایل قبلاً ثبت شده است" };

  if (nationalId) {
    const takenNationalId = await prisma.user.findFirst({
      where: { nationalId, NOT: { id: user.id } },
      select: { id: true },
    });
    if (takenNationalId) return { error: "این کد ملی قبلاً ثبت شده است" };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: phones[0],
      phones,
      nationalId,
      cardNumbers,
    },
  });
  await writeAudit({
    actorId: user.id,
    action: "update_profile",
    entity: "User",
    entityId: user.id,
    before: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      phones: user.phones,
      nationalId: user.nationalId,
      cardNumbers: user.cardNumbers,
    },
    after: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: phones[0],
      phones,
      nationalId,
      cardNumbers,
    },
  });
  revalidatePath("/panel/account/profile");
  revalidatePath("/panel");
  return { ok: true };
}

export async function signOutAction() {
  const session = await auth();
  if (!session) redirect("/");
}

export async function completeSetupAction(_: unknown, formData: FormData) {
  const user = await getSessionUser();
  if (!user?.isSuperAdmin) return { error: "دسترسی کافی ندارید" };

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const currency = String(formData.get("currency") ?? "تومان").trim() || "تومان";
  const unitsRaw = String(formData.get("units") ?? "");
  if (!name) return { error: "نام ساختمان الزامی است" };

  const building = await prisma.building.findFirst();
  if (!building) return { error: "ساختمان یافت نشد" };

  await prisma.building.update({
    where: { id: building.id },
    data: { name, address: address || null, currency, setupComplete: true },
  });

  const lines = unitsRaw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const [number, floor, area] = line.split(/[,،]/).map((part) => part.trim());
    if (!number) continue;
    await prisma.unit.upsert({
      where: { number },
      update: {
        floor: floor ? Number(floor) : undefined,
        areaM2: area ? area : undefined,
      },
      create: {
        number,
        floor: floor ? Number(floor) : null,
        areaM2: area ? area : null,
      },
    });
  }

  const existingItems = await prisma.chargeItem.count();
  if (existingItems === 0) {
    await prisma.chargeItem.createMany({
      data: [
        {
          name: "شارژ عمومی",
          kind: "GENERAL",
          fund: "OPERATING",
          method: "EQUAL",
          amount: 0,
          appliesTo: "ALL",
          sortOrder: 1,
        },
        {
          name: "صندوق ذخیره مالکین",
          kind: "RESERVE",
          fund: "RESERVE",
          method: "EQUAL",
          amount: 0,
          appliesTo: "OWNERS",
          sortOrder: 1,
        },
      ],
    });
  }

  revalidatePath("/");
  redirect("/panel");
}
