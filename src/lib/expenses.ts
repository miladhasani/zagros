import { FundType } from "@prisma/client";
import { format } from "date-fns-jalali";
import { prisma } from "@/lib/prisma";

const DEFAULT_CATEGORIES: Record<FundType, string[]> = {
  OPERATING: [
    "نگهداری و تعمیرات",
    "قبض مشاع",
    "نظافت",
    "باغبانی",
    "خرید وسایل",
    "بیمه",
    "فاکتور خرید",
    "سایر",
  ],
  RESERVE: [
    "تعمیرات اساسی",
    "نما و سازه",
    "آسانسور",
    "پشت‌بام و ایزوگام",
    "لوله و تأسیسات",
    "سایر",
  ],
};

export function parseFund(raw: unknown): FundType | null {
  return raw === "OPERATING" || raw === "RESERVE" ? raw : null;
}

export function expenseBasePath(fund: FundType) {
  return fund === "RESERVE" ? "/panel/reserve" : "/panel/charges";
}

export async function ensureExpenseCategories() {
  for (const fund of [FundType.OPERATING, FundType.RESERVE] as const) {
    const count = await prisma.expenseCategory.count({ where: { fund } });
    if (count > 0) continue;
    await prisma.expenseCategory.createMany({
      data: DEFAULT_CATEGORIES[fund].map((name, index) => ({
        name,
        fund,
        sortOrder: index + 1,
      })),
    });
  }
}

export function jalaliParts(date: Date) {
  return {
    jalaliYear: Number(format(date, "yyyy")),
    jalaliMonth: Number(format(date, "M")),
  };
}
