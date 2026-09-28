"use server";

import { revalidatePath } from "next/cache";
import { writeAudit } from "@/lib/audit";
import { expenseBasePath, jalaliParts, parseFund } from "@/lib/expenses";
import { saveUpload } from "@/lib/files";
import { parseMoneyInput } from "@/lib/format";
import { parseJalaliDate } from "@/lib/jalali";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

function revalidateExpensePaths() {
  revalidatePath("/panel/charges");
  revalidatePath("/panel/reserve");
  revalidatePath("/panel/settings/lists");
}

export async function createExpenseAction(_: unknown, formData: FormData) {
  const actor = await requireAdmin();
  const fund = parseFund(formData.get("fund"));
  const categoryId = String(formData.get("categoryId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amount = parseMoneyInput(String(formData.get("amount") ?? "0"));
  const paidAt = parseJalaliDate(String(formData.get("paidAt") ?? ""));
  const transactionNumber = String(formData.get("transactionNumber") ?? "").trim() || null;
  if (!fund) return { error: "صندوق نامعتبر است" };
  if (!description) return { error: "شرح هزینه را وارد کنید" };
  if (!amount || amount <= 0) return { error: "مبلغ معتبر نیست" };
  if (!paidAt) return { error: "تاریخ پرداخت را انتخاب کنید" };

  const category = await prisma.expenseCategory.findUnique({ where: { id: categoryId } });
  if (!category || !category.isActive || category.fund !== fund) {
    return { error: "نوع هزینه را انتخاب کنید" };
  }

  const file = formData.get("invoice");
  let filePath: string | null = null;
  let fileName: string | null = null;
  if (file instanceof File && file.size > 0) {
    const saved = await saveUpload(file, "expenses");
    filePath = saved.rel;
    fileName = saved.fileName;
  }

  const parts = jalaliParts(paidAt);
  const item = await prisma.buildingExpense.create({
    data: {
      fund,
      categoryId: category.id,
      description,
      amount,
      paidAt,
      transactionNumber,
      jalaliYear: parts.jalaliYear,
      jalaliMonth: parts.jalaliMonth,
      filePath,
      fileName,
      recordedById: actor.id,
    },
  });
  await writeAudit({
    actorId: actor.id,
    action: "create",
    entity: "BuildingExpense",
    entityId: item.id,
    after: { fund, description, amount, ...parts },
  });
  revalidateExpensePaths();
  return { ok: true, year: parts.jalaliYear, month: parts.jalaliMonth, href: expenseBasePath(fund) };
}

export async function deleteExpenseAction(id: string) {
  const actor = await requireAdmin();
  await prisma.buildingExpense.delete({ where: { id } });
  await writeAudit({ actorId: actor.id, action: "delete", entity: "BuildingExpense", entityId: id });
  revalidateExpensePaths();
}

export async function createExpenseCategoryAction(_: unknown, formData: FormData) {
  const actor = await requireAdmin();
  const fund = parseFund(formData.get("fund"));
  const name = String(formData.get("name") ?? "").trim();
  if (!fund) return { error: "فهرست نامعتبر است" };
  if (!name) return { error: "نام نوع هزینه را وارد کنید" };
  const exists = await prisma.expenseCategory.findFirst({ where: { fund, name } });
  if (exists) {
    if (!exists.isActive) {
      await prisma.expenseCategory.update({ where: { id: exists.id }, data: { isActive: true } });
      await writeAudit({
        actorId: actor.id,
        action: "update",
        entity: "ExpenseCategory",
        entityId: exists.id,
        after: { name, fund, isActive: true },
      });
      revalidateExpensePaths();
      return { ok: true };
    }
    return { error: "این نوع هزینه از قبل وجود دارد" };
  }
  const last = await prisma.expenseCategory.aggregate({
    where: { fund },
    _max: { sortOrder: true },
  });
  const created = await prisma.expenseCategory.create({
    data: { name, fund, sortOrder: (last._max.sortOrder ?? 0) + 1 },
  });
  await writeAudit({
    actorId: actor.id,
    action: "create",
    entity: "ExpenseCategory",
    entityId: created.id,
    after: { name, fund },
  });
  revalidateExpensePaths();
  return { ok: true };
}

export async function renameExpenseCategoryAction(formData: FormData) {
  const actor = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return { error: "نام نوع هزینه را وارد کنید" };
  const current = await prisma.expenseCategory.findUnique({ where: { id } });
  if (!current) return { error: "نوع هزینه یافت نشد" };
  const clash = await prisma.expenseCategory.findFirst({
    where: { fund: current.fund, name, NOT: { id } },
  });
  if (clash) return { error: "نوع دیگری با این نام در همین فهرست وجود دارد" };
  if (current.name !== name) {
    await prisma.expenseCategory.update({ where: { id }, data: { name } });
    await writeAudit({
      actorId: actor.id,
      action: "update",
      entity: "ExpenseCategory",
      entityId: id,
      before: { name: current.name },
      after: { name },
    });
  }
  revalidateExpensePaths();
  return { ok: true };
}

export async function deleteExpenseCategoryAction(id: string) {
  const actor = await requireAdmin();
  const current = await prisma.expenseCategory.findUnique({
    where: { id },
    include: { _count: { select: { expenses: true } } },
  });
  if (!current) return { error: "نوع هزینه یافت نشد" };
  if (current._count.expenses > 0) {
    await prisma.expenseCategory.update({ where: { id }, data: { isActive: false } });
    await writeAudit({
      actorId: actor.id,
      action: "update",
      entity: "ExpenseCategory",
      entityId: id,
      after: { isActive: false },
    });
  } else {
    await prisma.expenseCategory.delete({ where: { id } });
    await writeAudit({ actorId: actor.id, action: "delete", entity: "ExpenseCategory", entityId: id });
  }
  revalidateExpensePaths();
}

export async function restoreExpenseCategoryAction(id: string) {
  const actor = await requireAdmin();
  await prisma.expenseCategory.update({ where: { id }, data: { isActive: true } });
  await writeAudit({
    actorId: actor.id,
    action: "update",
    entity: "ExpenseCategory",
    entityId: id,
    after: { isActive: true },
  });
  revalidateExpensePaths();
}
