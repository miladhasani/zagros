import {
  AmenityType,
  ChargeKind,
  ExpenseKind,
  FundType,
  PeriodStatus,
} from "@prisma/client";
import { moneyNumber } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function roundMoney(value: number) {
  return Math.round(value);
}

export function generalChargeShares(input: {
  constantTotal: number;
  variableTotal: number;
  unitCount: number;
  totalPeople: number;
  residentCount: number;
}) {
  const unitCount = Math.max(input.unitCount, 1);
  const constantShare = roundMoney(input.constantTotal / unitCount);
  const perPersonRate = input.totalPeople > 0 ? input.variableTotal / input.totalPeople : 0;
  const variableShare = roundMoney(perPersonRate * input.residentCount);
  return { constantShare, perPersonRate, variableShare, total: constantShare + variableShare };
}

export async function ensureChargeCatalog() {
  const items = await prisma.chargeItem.findMany({ select: { kind: true } });
  if (!items.some((item) => item.kind === ChargeKind.GENERAL)) {
    await prisma.chargeItem.create({
      data: {
        name: "شارژ عمومی",
        kind: ChargeKind.GENERAL,
        fund: FundType.OPERATING,
        method: "EQUAL",
        amount: 0,
        appliesTo: "ALL",
        sortOrder: 1,
      },
    });
  }
  if (!items.some((item) => item.kind === ChargeKind.RESERVE)) {
    await prisma.chargeItem.create({
      data: {
        name: "صندوق ذخیره مالکین",
        kind: ChargeKind.RESERVE,
        fund: FundType.RESERVE,
        method: "EQUAL",
        amount: 0,
        appliesTo: "OWNERS",
        sortOrder: 1,
      },
    });
  }
}

export async function generatePeriodCharges(periodId: string) {
  const period = await prisma.billingPeriod.findUnique({ where: { id: periodId } });
  if (!period) throw new Error("دوره یافت نشد");
  if (period.status !== PeriodStatus.DRAFT) throw new Error("فقط دوره پیش‌نویس قابل تولید است");

  await ensureChargeCatalog();
  const units = await prisma.unit.findMany({ orderBy: { number: "asc" } });
  await prisma.unitCharge.deleteMany({ where: { periodId } });

  if (period.fund === FundType.RESERVE) {
    const reserve = await prisma.chargeItem.findFirst({
      where: { kind: ChargeKind.RESERVE, isActive: true },
    });
    const amount = reserve ? roundMoney(moneyNumber(reserve.amount)) : 0;
    for (const unit of units) {
      await prisma.unitCharge.create({
        data: {
          unitId: unit.id,
          periodId,
          total: amount,
          lines: reserve
            ? { create: [{ chargeItemId: reserve.id, label: reserve.name, amount }] }
            : undefined,
        },
      });
    }
    return;
  }

  const [general, amenities, levies] = await Promise.all([
    prisma.chargeItem.findFirst({
      where: { kind: ChargeKind.GENERAL, isActive: true },
      include: { expenses: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.buildingAmenity.findMany(),
    prisma.occasionalLevy.findMany({
      where: { periodId },
      include: { catalogItem: true },
    }),
  ]);

  const constantTotal =
    general?.expenses
      .filter((row) => row.kind === ExpenseKind.CONSTANT)
      .reduce((sum, row) => sum + moneyNumber(row.amount), 0) ?? 0;
  const variableTotal =
    general?.expenses
      .filter((row) => row.kind === ExpenseKind.VARIABLE)
      .reduce((sum, row) => sum + moneyNumber(row.amount), 0) ?? 0;
  const totalPeople = units.reduce((sum, unit) => sum + unit.residentCount, 0);

  for (const unit of units) {
    const shares = generalChargeShares({
      constantTotal,
      variableTotal,
      unitCount: units.length,
      totalPeople,
      residentCount: unit.residentCount,
    });
    const lines: {
      chargeItemId?: string;
      label: string;
      amount: number;
    }[] = [];

    if (general) {
      lines.push({
        chargeItemId: general.id,
        label: "شارژ عمومی — هزینه‌های ثابت",
        amount: shares.constantShare,
      });
      lines.push({
        chargeItemId: general.id,
        label: "شارژ عمومی — هزینه‌های متغیر",
        amount: shares.variableShare,
      });
    }

    for (const amenity of amenities.filter((row) => row.unitId === unit.id)) {
      lines.push({
        label: `${AMENITY_TYPE_LABEL[amenity.type]} اضافه — ${amenity.name}`,
        amount: roundMoney(moneyNumber(amenity.monthlyFee)),
      });
    }

    for (const levy of levies.filter((row) => row.unitId === unit.id)) {
      const base =
        levy.catalogItem.kind === ChargeKind.FINE
          ? `جریمه — ${levy.catalogItem.name}`
          : levy.catalogItem.name;
      lines.push({
        chargeItemId: levy.catalogItemId,
        label: levy.note ? `${base} — ${levy.note}` : base,
        amount: roundMoney(moneyNumber(levy.amount)),
      });
    }

    const total = lines.reduce((sum, line) => sum + line.amount, 0);
    await prisma.unitCharge.create({
      data: {
        unitId: unit.id,
        periodId,
        total,
        lines: { create: lines },
      },
    });
  }
}

export async function unitBalance(unitId: string, fund: FundType) {
  const charges = await prisma.unitCharge.findMany({
    where: {
      unitId,
      period: { fund, status: { in: [PeriodStatus.ISSUED, PeriodStatus.CLOSED] } },
    },
  });
  const payments = await prisma.payment.findMany({
    where: { unitId, fund },
  });
  const charged = charges.reduce((sum, row) => sum + moneyNumber(row.total), 0);
  const paid = payments.reduce((sum, row) => sum + moneyNumber(row.amount), 0);
  return { charged, paid, remaining: charged - paid };
}

export const FUND_LABEL: Record<FundType, string> = {
  OPERATING: "شارژ",
  RESERVE: "صندوق ذخیره",
};

export const PERIOD_STATUS_LABEL: Record<PeriodStatus, string> = {
  DRAFT: "پیش‌نویس",
  ISSUED: "صادر شده",
  CLOSED: "بسته",
};

export const AMENITY_TYPE_LABEL: Record<AmenityType, string> = {
  STORAGE: "انباری",
  PARKING: "پارکینگ",
  OTHER: "سایر",
};

export const CHARGE_KIND_LABEL: Record<ChargeKind, string> = {
  GENERAL: "شارژ عمومی",
  RESERVE: "صندوق مالکین",
  OCCASIONAL: "شارژ موردی",
  FINE: "جریمه",
};

export type ExpenseInput = { label: string; amount: number };
