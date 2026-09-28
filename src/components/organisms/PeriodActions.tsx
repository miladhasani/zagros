"use client";

import { closePeriodAction, createPeriodAction, issuePeriodAction, regeneratePeriodAction } from "@/actions/billing";
import { Button, Input, Select } from "@/components/atoms";
import { JALALI_MONTHS, currentJalali } from "@/lib/jalali";
import type { FundType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PeriodActions({
  fund,
  periodId,
  status,
}: {
  fund: FundType;
  periodId?: string;
  status?: string;
}) {
  const now = currentJalali();
  const [year, setYear] = useState(now.year);
  const [month, setMonth] = useState(now.month);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function create() {
    setPending(true);
    await createPeriodAction(fund, year, month);
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
      <Select value={String(month)} onChange={(e) => setMonth(Number(e.target.value))} className="sm:w-40">
        {JALALI_MONTHS.map((label, index) => (
          <option key={label} value={index + 1}>
            {label}
          </option>
        ))}
      </Select>
      <Input
        value={year}
        onChange={(e) => setYear(Number(e.target.value))}
        className="sm:w-28"
        inputMode="numeric"
      />
      <Button onClick={create} disabled={pending}>
        ایجاد دوره و محاسبه
      </Button>
      {periodId && status === "DRAFT" ? (
        <>
          <Button
            variant="secondary"
            onClick={async () => {
              await regeneratePeriodAction(periodId);
              router.refresh();
            }}
          >
            محاسبه مجدد
          </Button>
          <Button
            onClick={async () => {
              await issuePeriodAction(periodId);
              router.refresh();
            }}
          >
            صدور صورت‌حساب
          </Button>
        </>
      ) : null}
      {periodId && status === "ISSUED" ? (
        <Button
          variant="outline"
          onClick={async () => {
            await closePeriodAction(periodId);
            router.refresh();
          }}
        >
          بستن دوره
        </Button>
      ) : null}
    </div>
  );
}
