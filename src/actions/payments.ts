"use server";

import { FundType, PaymentMethod } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { writeAudit } from "@/lib/audit";
import { saveUpload } from "@/lib/files";
import { parseMoneyInput } from "@/lib/format";
import { parseJalaliDate } from "@/lib/jalali";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export async function recordPaymentAction(_: unknown, formData: FormData) {
  const actor = await requireAdmin();
  const unitId = String(formData.get("unitId") ?? "");
  const fund = String(formData.get("fund") ?? "OPERATING") as FundType;
  const amount = parseMoneyInput(String(formData.get("amount") ?? "0"));
  const note = String(formData.get("note") ?? "").trim();
  const method = String(formData.get("method") ?? "BANK_TRANSFER") as PaymentMethod;
  const periodId = String(formData.get("periodId") ?? "") || null;
  const paidAtRaw = String(formData.get("paidAt") ?? "");
  if (!unitId || !amount || amount <= 0) return { error: "واحد و مبلغ را درست وارد کنید" };

  const file = formData.get("receipt");
  let receiptPath: string | null = null;
  if (file instanceof File && file.size > 0) {
    const saved = await saveUpload(file, "receipts");
    receiptPath = saved.rel;
  }

  const payment = await prisma.payment.create({
    data: {
      unitId,
      fund,
      amount,
      method,
      note: note || null,
      periodId,
      receiptPath,
      recordedById: actor.id,
      paidAt: parseJalaliDate(paidAtRaw) ?? new Date(),
    },
  });

  await writeAudit({
    actorId: actor.id,
    action: "create",
    entity: "Payment",
    entityId: payment.id,
    after: { unitId, amount, fund },
  });
  revalidatePath("/panel/debts");
  revalidatePath("/panel/charges");
  revalidatePath("/panel/reserve");
  revalidatePath("/panel/unit/charge");
  revalidatePath("/panel/unit/reserve");
  return { ok: true };
}
