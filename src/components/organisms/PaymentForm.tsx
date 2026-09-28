"use client";

import { recordPaymentAction } from "@/actions/payments";
import { Button, Card, DatePicker, Input, MoneyInput, Select, Textarea } from "@/components/atoms";
import { FormField } from "@/components/molecules";
import type { FundType } from "@prisma/client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function PaymentForm({
  units,
  defaultFund = "OPERATING",
  periodId,
  lockFund = false,
}: {
  units: { id: string; number: string }[];
  defaultFund?: FundType;
  periodId?: string | null;
  lockFund?: boolean;
}) {
  const [state, action, pending] = useActionState(recordPaymentAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state && "ok" in state) router.refresh();
  }, [state, router]);

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">ثبت واریزی</h2>
      <form action={action} className="grid gap-4 sm:grid-cols-2">
        {periodId ? <input type="hidden" name="periodId" value={periodId} /> : null}
        {lockFund ? <input type="hidden" name="fund" value={defaultFund} /> : null}
        <FormField label="واحد">
          <Select name="unitId" required>
            <option value="">انتخاب کنید</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                واحد {unit.number}
              </option>
            ))}
          </Select>
        </FormField>
        {lockFund ? null : (
          <FormField label="صندوق">
            <Select name="fund" defaultValue={defaultFund}>
              <option value="OPERATING">شارژ</option>
              <option value="RESERVE">صندوق ذخیره</option>
            </Select>
          </FormField>
        )}
        <FormField label="مبلغ">
          <MoneyInput name="amount" required />
        </FormField>
        <FormField label="روش">
          <Select name="method" defaultValue="BANK_TRANSFER">
            <option value="BANK_TRANSFER">کارت به کارت / واریز</option>
            <option value="CASH">نقد</option>
            <option value="OTHER">سایر</option>
          </Select>
        </FormField>
        <FormField label="تاریخ واریز">
          <DatePicker name="paidAt" defaultToday />
        </FormField>
        <FormField label="رسید">
          <Input name="receipt" type="file" />
        </FormField>
        <FormField label="توضیح">
          <Textarea name="note" />
        </FormField>
        {state && "error" in state && state.error ? (
          <p className="text-sm text-danger sm:col-span-2">{state.error}</p>
        ) : null}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            ثبت واریزی
          </Button>
        </div>
      </form>
    </Card>
  );
}
