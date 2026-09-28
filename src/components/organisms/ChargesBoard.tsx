"use client";

import {
  applyOccasionalLevyAction,
  deleteAmenityAction,
  deleteOccasionalCatalogAction,
  deleteOccasionalLevyAction,
  saveGeneralExpensesAction,
  saveReserveAmountAction,
  upsertAmenityAction,
  upsertOccasionalCatalogAction,
} from "@/actions/billing";
import { Button, Card, Input, MoneyInput, Select } from "@/components/atoms";
import { FormField, KeyAmountField, type KeyAmountRow } from "@/components/molecules";
import { AMENITY_TYPE_LABEL, generalChargeShares } from "@/lib/billing";
import { faMoney, parseMoneyInput } from "@/lib/format";
import { AmenityType } from "@prisma/client";
import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type ChargesUnit = { id: string; number: string; residentCount: number };

export type ChargesExpense = { kind: "CONSTANT" | "VARIABLE"; label: string; amount: string };

export type ChargesLevy = {
  id: string;
  unitId: string;
  amount: string;
  note: string | null;
  catalogName: string;
  kind: "OCCASIONAL" | "FINE";
};

export function ChargesBoard({
  currency,
  units,
  generalExpenses,
  reserveAmount,
  occasionals,
  fines,
  amenities,
  levies,
  draftPeriodLabel,
}: {
  currency: string;
  units: ChargesUnit[];
  generalExpenses: ChargesExpense[];
  reserveAmount: string;
  occasionals: { id: string; name: string; amount: string }[];
  fines: { id: string; name: string; amount: string }[];
  amenities: {
    id: string;
    type: AmenityType;
    name: string;
    monthlyFee: string;
    unitId: string | null;
  }[];
  levies: ChargesLevy[];
  draftPeriodLabel: string | null;
}) {
  return (
    <div className="grid gap-6">
      <GeneralChargeCard
        currency={currency}
        units={units}
        expenses={generalExpenses}
      />
      <ReserveChargeCard defaultAmount={reserveAmount} currency={currency} />
      <LevyCatalogCard
        kind="OCCASIONAL"
        title="شارژهای موردی"
        description="مواردی مثل باربری یا آسانسور باری فقط وقتی به واحد اضافه می‌شوند که استفاده شده باشند."
        namePlaceholder="مثلاً آسانسور باری"
        addLabel="افزودن نوع شارژ"
        applyError="برای اعمال شارژ موردی، ابتدا یک دوره پیش‌نویس بسازید."
        catalog={occasionals}
        units={units}
        levies={levies.filter((row) => row.kind === "OCCASIONAL")}
        draftPeriodLabel={draftPeriodLabel}
        currency={currency}
      />
      <LevyCatalogCard
        kind="FINE"
        title="جریمه‌ها"
        description="جریمه خسارت به مشاعات ساختمان فقط وقتی به واحد اضافه می‌شود که خسارتی وارد شده باشد."
        namePlaceholder="مثلاً خسارت آسانسور"
        addLabel="افزودن نوع جریمه"
        applyError="برای ثبت جریمه، ابتدا یک دوره پیش‌نویس بسازید."
        catalog={fines}
        units={units}
        levies={levies.filter((row) => row.kind === "FINE")}
        draftPeriodLabel={draftPeriodLabel}
        currency={currency}
      />
      <AmenitiesCard amenities={amenities} units={units} currency={currency} />
    </div>
  );
}

function GeneralChargeCard({
  currency,
  units,
  expenses,
}: {
  currency: string;
  units: ChargesUnit[];
  expenses: ChargesExpense[];
}) {
  const [state, action, pending] = useActionState(saveGeneralExpensesAction, null);
  const router = useRouter();
  const [constants, setConstants] = useState<KeyAmountRow[]>(() =>
    expenses.filter((row) => row.kind === "CONSTANT").map((row) => ({ label: row.label, amount: row.amount })),
  );
  const [variables, setVariables] = useState<KeyAmountRow[]>(() =>
    expenses.filter((row) => row.kind === "VARIABLE").map((row) => ({ label: row.label, amount: row.amount })),
  );

  useEffect(() => {
    if (state && "ok" in state && state.ok) router.refresh();
  }, [state, router]);

  const constantTotal = useMemo(
    () => constants.reduce((sum, row) => sum + parseMoneyInput(row.amount), 0),
    [constants],
  );
  const variableTotal = useMemo(
    () => variables.reduce((sum, row) => sum + parseMoneyInput(row.amount), 0),
    [variables],
  );
  const totalPeople = units.reduce((sum, unit) => sum + unit.residentCount, 0);
  const sample = generalChargeShares({
    constantTotal,
    variableTotal,
    unitCount: units.length,
    totalPeople,
    residentCount: 1,
  });

  return (
    <Card>
      <h2 className="text-lg font-semibold">شارژ عمومی</h2>
      <p className="mt-1 text-sm text-ink-muted">
        هزینه‌های ثابت بین همه واحدها تقسیم می‌شود. هزینه‌های متغیر فقط به نسبت تعداد نفرات ساکن محاسبه می‌شود.
      </p>
      <form action={action} className="mt-5 grid gap-6 lg:grid-cols-2">
        <FormField label="هزینه‌های ثابت">
          <KeyAmountField
            labelName="constantLabel"
            amountName="constantAmount"
            defaultValue={constants}
            addLabel="افزودن هزینه"
            emptyLabel="هنوز هزینه ثابتی ثبت نشده"
            labelPlaceholder="مثلاً نگهداری آسانسور"
            amountPlaceholder="مبلغ"
            onChange={setConstants}
          />
        </FormField>
        <FormField label="هزینه‌های متغیر">
          <KeyAmountField
            labelName="variableLabel"
            amountName="variableAmount"
            defaultValue={variables}
            addLabel="افزودن هزینه"
            emptyLabel="هنوز هزینه متغیری ثبت نشده"
            labelPlaceholder="مثلاً آب مشاع"
            amountPlaceholder="مبلغ"
            onChange={setVariables}
          />
        </FormField>
        <div className="rounded-[var(--radius-md)] border border-border bg-surface-muted p-4 text-sm lg:col-span-2">
          <p className="font-medium text-ink">نحوه محاسبه</p>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <PreviewStat label="جمع ثابت" value={faMoney(constantTotal, currency)} />
            <PreviewStat
              label="سهم هر واحد از ثابت"
              value={units.length ? faMoney(sample.constantShare, currency) : "—"}
            />
            <PreviewStat label="جمع متغیر" value={faMoney(variableTotal, currency)} />
            <PreviewStat
              label="نرخ هر نفر"
              value={totalPeople ? faMoney(sample.perPersonRate, currency) : "—"}
            />
          </dl>
          {units.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[28rem] text-sm">
                <thead className="text-ink-muted">
                  <tr>
                    <th className="py-2 text-right font-medium">واحد</th>
                    <th className="py-2 text-right font-medium">نفرات</th>
                    <th className="py-2 text-left font-medium">ثابت</th>
                    <th className="py-2 text-left font-medium">متغیر</th>
                    <th className="py-2 text-left font-medium">جمع</th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((unit) => {
                    const share = generalChargeShares({
                      constantTotal,
                      variableTotal,
                      unitCount: units.length,
                      totalPeople,
                      residentCount: unit.residentCount,
                    });
                    return (
                      <tr key={unit.id} className="border-t border-border">
                        <td className="py-2">{unit.number}</td>
                        <td className="py-2">{unit.residentCount === 0 ? "۰ (خالی)" : unit.residentCount}</td>
                        <td className="py-2 text-left tabular-nums">{faMoney(share.constantShare, currency)}</td>
                        <td className="py-2 text-left tabular-nums">{faMoney(share.variableShare, currency)}</td>
                        <td className="py-2 text-left tabular-nums font-medium">
                          {faMoney(share.total, currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-ink-faint">برای پیش‌نمایش، ابتدا واحد تعریف کنید.</p>
          )}
        </div>
        {state && "error" in state && state.error ? (
          <p className="text-sm text-danger lg:col-span-2">{state.error}</p>
        ) : null}
        {state && "ok" in state && state.ok ? (
          <p className="text-sm text-success lg:col-span-2">هزینه‌های شارژ عمومی ذخیره شد.</p>
        ) : null}
        <div className="lg:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "در حال ذخیره..." : "ذخیره شارژ عمومی"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ReserveChargeCard({
  defaultAmount,
  currency,
}: {
  defaultAmount: string;
  currency: string;
}) {
  const [state, action, pending] = useActionState(saveReserveAmountAction, null);
  const router = useRouter();
  useEffect(() => {
    if (state && "ok" in state && state.ok) router.refresh();
  }, [state, router]);

  return (
    <Card>
      <h2 className="text-lg font-semibold">شارژ صندوق مالکین</h2>
      <p className="mt-1 text-sm text-ink-muted">
        مبلغ ماهانه برای هر واحد، در صورت‌حساب صندوق ذخیره مالکین ثبت می‌شود.
      </p>
      <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2">
        <FormField label="مبلغ ماهانه هر واحد">
          <MoneyInput name="amount" defaultValue={defaultAmount} />
        </FormField>
        <p className="self-end text-sm text-ink-faint">واحد پول: {currency}</p>
        {state && "error" in state && state.error ? (
          <p className="text-sm text-danger sm:col-span-2">{state.error}</p>
        ) : null}
        {state && "ok" in state && state.ok ? (
          <p className="text-sm text-success sm:col-span-2">مبلغ صندوق ذخیره ذخیره شد.</p>
        ) : null}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "در حال ذخیره..." : "ذخیره مبلغ صندوق"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function LevyCatalogCard({
  kind,
  title,
  description,
  namePlaceholder,
  addLabel,
  applyError,
  catalog,
  units,
  levies,
  draftPeriodLabel,
  currency,
}: {
  kind: "OCCASIONAL" | "FINE";
  title: string;
  description: string;
  namePlaceholder: string;
  addLabel: string;
  applyError: string;
  catalog: { id: string; name: string; amount: string }[];
  units: ChargesUnit[];
  levies: ChargesLevy[];
  draftPeriodLabel: string | null;
  currency: string;
}) {
  const [catalogState, catalogAction, catalogPending] = useActionState(upsertOccasionalCatalogAction, null);
  const [applyState, applyAction, applyPending] = useActionState(applyOccasionalLevyAction, null);
  const router = useRouter();
  const [selectedCatalog, setSelectedCatalog] = useState(catalog[0]?.id ?? "");
  const selected = catalog.find((item) => item.id === selectedCatalog);

  useEffect(() => {
    if (!catalog.some((item) => item.id === selectedCatalog)) {
      setSelectedCatalog(catalog[0]?.id ?? "");
    }
  }, [catalog, selectedCatalog]);

  useEffect(() => {
    if ((catalogState && "ok" in catalogState) || (applyState && "ok" in applyState)) {
      router.refresh();
    }
  }, [catalogState, applyState, router]);

  return (
    <Card>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-ink-muted">{description}</p>
      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <form action={catalogAction} className="grid gap-4">
          <input type="hidden" name="kind" value={kind} />
          <h3 className="font-medium">{kind === "FINE" ? "تعریف نوع جریمه" : "تعریف نوع شارژ"}</h3>
          <FormField label="نام">
            <Input name="name" required placeholder={namePlaceholder} />
          </FormField>
          <FormField label="مبلغ پیش‌فرض">
            <MoneyInput name="amount" defaultValue="0" />
          </FormField>
          {catalogState && "error" in catalogState && catalogState.error ? (
            <p className="text-sm text-danger">{catalogState.error}</p>
          ) : null}
          <Button type="submit" disabled={catalogPending}>
            {catalogPending ? "در حال ذخیره..." : addLabel}
          </Button>
          <ul className="grid gap-2">
            {catalog.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm"
              >
                <span>
                  {item.name}
                  <span className="mr-2 text-ink-faint" dir="ltr">
                    {faMoney(parseMoneyInput(item.amount), currency)}
                  </span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await deleteOccasionalCatalogAction(item.id);
                    router.refresh();
                  }}
                >
                  حذف
                </Button>
              </li>
            ))}
          </ul>
        </form>
        <form action={applyAction} className="grid gap-4">
          <h3 className="font-medium">اعمال روی واحد</h3>
          {draftPeriodLabel ? (
            <p className="text-xs text-ink-faint">ثبت روی دوره پیش‌نویس {draftPeriodLabel}</p>
          ) : (
            <p className="text-xs text-danger">{applyError}</p>
          )}
          <FormField label={kind === "FINE" ? "نوع جریمه" : "نوع شارژ"}>
            <Select
              name="catalogItemId"
              value={selectedCatalog}
              onChange={(event) => setSelectedCatalog(event.target.value)}
              disabled={!catalog.length}
            >
              {catalog.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="واحد">
            <Select name="unitId" disabled={!units.length}>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  واحد {unit.number}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="مبلغ">
            <MoneyInput name="amount" defaultValue={selected?.amount ?? "0"} key={selectedCatalog} />
          </FormField>
          <FormField label="توضیح">
            <Input name="note" placeholder="اختیاری" />
          </FormField>
          {applyState && "error" in applyState && applyState.error ? (
            <p className="text-sm text-danger">{applyState.error}</p>
          ) : null}
          <Button type="submit" disabled={applyPending || !draftPeriodLabel || !catalog.length}>
            {applyPending ? "در حال ثبت..." : kind === "FINE" ? "ثبت جریمه برای واحد" : "ثبت برای واحد"}
          </Button>
          {levies.length ? (
            <ul className="grid gap-2">
              {levies.map((levy) => (
                <li
                  key={levy.id}
                  className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm"
                >
                  <span>
                    {levy.catalogName} — واحد {units.find((unit) => unit.id === levy.unitId)?.number ?? "—"}
                    {levy.note ? ` (${levy.note})` : ""}
                    <span className="mr-2 text-ink-faint">
                      {faMoney(parseMoneyInput(levy.amount), currency)}
                    </span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await deleteOccasionalLevyAction(levy.id);
                      router.refresh();
                    }}
                  >
                    حذف
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </form>
      </div>
    </Card>
  );
}

function AmenitiesCard({
  amenities,
  units,
  currency,
}: {
  amenities: {
    id: string;
    type: AmenityType;
    name: string;
    monthlyFee: string;
    unitId: string | null;
  }[];
  units: ChargesUnit[];
  currency: string;
}) {
  const [state, action, pending] = useActionState(upsertAmenityAction, null);
  const router = useRouter();
  useEffect(() => {
    if (state && "ok" in state && state.ok) router.refresh();
  }, [state, router]);

  return (
    <Card>
      <h2 className="text-lg font-semibold">امکانات اشتراکی</h2>
      <p className="mt-1 text-sm text-ink-muted">
        انباری، پارکینگ یا فضای اضافه ساختمان را اینجا تعریف کنید و به واحد واگذار کنید. پارکینگ و انباری همراه واحد جداگانه حساب نمی‌شود.
      </p>
      <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FormField label="نوع">
          <Select name="type" defaultValue="STORAGE">
            {Object.entries(AMENITY_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="نام">
          <Input name="name" required placeholder="مثلاً انباری B-3" />
        </FormField>
        <FormField label="اجاره ماهانه">
          <MoneyInput name="monthlyFee" defaultValue="0" />
        </FormField>
        <FormField label="واگذار به واحد">
          <Select name="unitId" defaultValue="">
            <option value="">بدون واگذاری</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                واحد {unit.number}
              </option>
            ))}
          </Select>
        </FormField>
        {state && "error" in state && state.error ? (
          <p className="text-sm text-danger sm:col-span-2 lg:col-span-4">{state.error}</p>
        ) : null}
        <div className="sm:col-span-2 lg:col-span-4">
          <Button type="submit" disabled={pending}>
            {pending ? "در حال ذخیره..." : "افزودن امکان"}
          </Button>
        </div>
      </form>
      <ul className="mt-5 grid gap-2">
        {amenities.length === 0 ? (
          <p className="text-sm text-ink-faint">هنوز امکان اشتراکی تعریف نشده است.</p>
        ) : (
          amenities.map((amenity) => (
            <li
              key={amenity.id}
              className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-border px-3 py-3 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium">
                  {AMENITY_TYPE_LABEL[amenity.type]} — {amenity.name}
                </p>
                <p className="text-ink-faint">
                  {faMoney(parseMoneyInput(amenity.monthlyFee), currency)}
                  {amenity.unitId
                    ? ` — واحد ${units.find((unit) => unit.id === amenity.unitId)?.number ?? ""}`
                    : " — بدون واگذاری"}
                </p>
              </div>
              <form action={upsertAmenityAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={amenity.id} />
                <input type="hidden" name="name" value={amenity.name} />
                <input type="hidden" name="type" value={amenity.type} />
                <input type="hidden" name="monthlyFee" value={amenity.monthlyFee} />
                <Select name="unitId" defaultValue={amenity.unitId ?? ""} className="sm:w-40">
                  <option value="">بدون واگذاری</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      واحد {unit.number}
                    </option>
                  ))}
                </Select>
                <Button type="submit" variant="secondary" size="sm">
                  واگذاری
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await deleteAmenityAction(amenity.id);
                    router.refresh();
                  }}
                >
                  حذف
                </Button>
              </form>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-ink-faint">{label}</dt>
      <dd className="mt-1 font-medium text-ink">{value}</dd>
    </div>
  );
}
