"use client";

import { createExpenseAction, deleteExpenseAction } from "@/actions/expenses";
import { Button, Card, DatePicker, DateSpan, Input, MoneyInput, Select, Textarea } from "@/components/atoms";
import { FormField } from "@/components/molecules";
import { expenseBasePath } from "@/lib/expenses";
import { faDigits, faMoney, parseMoneyInput } from "@/lib/format";
import { JALALI_MONTHS, periodLabel } from "@/lib/jalali";
import type { FundType } from "@prisma/client";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type ExpenseRow = {
  id: string;
  categoryName: string;
  description: string;
  amount: string;
  paidAt: string;
  transactionNumber: string | null;
  filePath: string | null;
};

export function ExpensesBoard({
  fund,
  currency,
  buildingName,
  year,
  month,
  categories,
  expenses,
  isStaff,
  printTitle,
  reportHint,
}: {
  fund: FundType;
  currency: string;
  buildingName: string;
  year: number;
  month: number;
  categories: { id: string; name: string }[];
  expenses: ExpenseRow[];
  isStaff: boolean;
  printTitle: string;
  reportHint: string;
}) {
  const total = expenses.reduce((sum, row) => sum + parseMoneyInput(row.amount), 0);
  const basePath = expenseBasePath(fund);

  return (
    <div className="grid gap-6">
      <MonthToolbar year={year} month={month} basePath={basePath} />
      {isStaff ? <ExpenseForm fund={fund} basePath={basePath} categories={categories} /> : null}
      <ExpenseReport
        buildingName={buildingName}
        printTitle={printTitle}
        reportHint={reportHint}
        currency={currency}
        year={year}
        month={month}
        expenses={expenses}
        total={total}
        isStaff={isStaff}
      />
    </div>
  );
}

function MonthToolbar({ year, month, basePath }: { year: number; month: number; basePath: string }) {
  const router = useRouter();
  const [nextYear, setNextYear] = useState(year);
  const [nextMonth, setNextMonth] = useState(month);

  useEffect(() => {
    setNextYear(year);
    setNextMonth(month);
  }, [year, month]);

  function go(nextY: number, nextM: number) {
    router.push(`${basePath}?year=${nextY}&month=${nextM}`);
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-3 print:hidden">
      <div className="flex flex-wrap items-end gap-2">
        <Select
          value={String(nextMonth)}
          onChange={(event) => {
            const value = Number(event.target.value);
            setNextMonth(value);
            go(nextYear, value);
          }}
          className="sm:w-40"
        >
          {JALALI_MONTHS.map((label, index) => (
            <option key={label} value={index + 1}>
              {label}
            </option>
          ))}
        </Select>
        <Input
          value={String(nextYear)}
          inputMode="numeric"
          className="sm:w-28"
          onChange={(event) => setNextYear(Number(event.target.value.replace(/\D/g, "")) || nextYear)}
          onBlur={() => go(nextYear, nextMonth)}
        />
      </div>
      <Button variant="secondary" onClick={() => window.print()}>
        چاپ / PDF
      </Button>
    </div>
  );
}

function ExpenseForm({
  fund,
  basePath,
  categories,
}: {
  fund: FundType;
  basePath: string;
  categories: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createExpenseAction, null);
  const [formKey, setFormKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      setFormKey((key) => key + 1);
      router.push(`${state.href ?? basePath}?year=${state.year}&month=${state.month}`);
      router.refresh();
    }
  }, [state, router, basePath]);

  return (
    <Card className="print:hidden">
      <h2 className="mb-4 text-lg font-semibold">ثبت هزینه جدید</h2>
      <form key={formKey} action={action} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="fund" value={fund} />
        <FormField label="نوع هزینه" hint="انواع را از مدیریت ← فهرست‌ها تعریف کنید.">
          {categories.length ? (
            <Select name="categoryId" required defaultValue={categories[0]?.id}>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          ) : (
            <p className="text-sm text-ink-muted">ابتدا نوعی در مدیریت ← فهرست‌ها تعریف کنید.</p>
          )}
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="شرح">
            <Textarea name="description" required className="min-h-24" />
          </FormField>
        </div>
        <FormField label="مبلغ">
          <MoneyInput name="amount" required />
        </FormField>
        <FormField label="تاریخ پرداخت">
          <DatePicker name="paidAt" defaultToday required />
        </FormField>
        <FormField label="شماره تراکنش">
          <Input name="transactionNumber" placeholder="اختیاری" />
        </FormField>
        <FormField label="پیوست فاکتور">
          <Input name="invoice" type="file" accept="image/*,.pdf,application/pdf" />
        </FormField>
        {state && "error" in state && state.error ? (
          <p className="text-sm text-danger sm:col-span-2">{state.error}</p>
        ) : null}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending || !categories.length}>
            {pending ? "در حال ثبت..." : "ثبت هزینه"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ExpenseReport({
  buildingName,
  printTitle,
  reportHint,
  currency,
  year,
  month,
  expenses,
  total,
  isStaff,
}: {
  buildingName: string;
  printTitle: string;
  reportHint: string;
  currency: string;
  year: number;
  month: number;
  expenses: ExpenseRow[];
  total: number;
  isStaff: boolean;
}) {
  const router = useRouter();

  return (
    <div className="expense-report">
      <div className="mb-4">
        <p className="hidden text-xl font-bold print:block">
          {buildingName} — {printTitle}
        </p>
        <h2 className="text-lg font-semibold print:mt-1">هزینه‌های {periodLabel(year, month)}</h2>
        <p className="mt-1 text-sm text-ink-muted print:hidden">{reportHint}</p>
      </div>

      {expenses.length ? (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-sm print:rounded-none print:border-border print:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead className="bg-surface-muted text-ink-muted">
                <tr>
                  <th className="px-3 py-2.5 text-right font-medium">نوع</th>
                  <th className="px-3 py-2.5 text-right font-medium">شرح</th>
                  <th className="px-3 py-2.5 text-right font-medium">تاریخ پرداخت</th>
                  <th className="px-3 py-2.5 text-right font-medium">شماره تراکنش</th>
                  <th className="px-3 py-2.5 text-left font-medium">مبلغ</th>
                  <th className="px-3 py-2.5 text-right font-medium print:hidden">فاکتور</th>
                  {isStaff ? <th className="px-3 py-2.5 text-right font-medium print:hidden">عملیات</th> : null}
                </tr>
              </thead>
              <tbody>
                {expenses.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="whitespace-nowrap px-3 py-2">{row.categoryName}</td>
                    <td className="px-3 py-2">{row.description}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <DateSpan value={row.paidAt} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2" dir="ltr">
                      {row.transactionNumber ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-left tabular-nums">
                      {faMoney(parseMoneyInput(row.amount), currency)}
                    </td>
                    <td className="px-3 py-2 print:hidden">
                      {row.filePath ? (
                        <a
                          className="text-accent hover:underline"
                          href={`/api/files?path=${encodeURIComponent(row.filePath)}`}
                        >
                          دانلود
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    {isStaff ? (
                      <td className="px-3 py-2 print:hidden">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={async () => {
                            if (!confirm("این هزینه حذف شود؟")) return;
                            await deleteExpenseAction(row.id);
                            router.refresh();
                          }}
                        >
                          حذف
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border-strong bg-surface-muted font-medium">
                  <td className="px-3 py-2.5" colSpan={4}>
                    جمع هزینه‌ها ({faDigits(expenses.length)} مورد)
                  </td>
                  <td className="px-3 py-2.5 text-left tabular-nums">{faMoney(total, currency)}</td>
                  <td className="print:hidden" />
                  {isStaff ? <td className="print:hidden" /> : null}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface-muted px-6 py-12 text-center text-ink-muted">
          برای {periodLabel(year, month)} هنوز هزینه‌ای ثبت نشده است.
        </p>
      )}
    </div>
  );
}
