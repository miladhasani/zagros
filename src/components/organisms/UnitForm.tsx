"use client";

import { upsertUnitAction } from "@/actions/units";
import { Button, Card, Input, Select, Textarea } from "@/components/atoms";
import { FormField, MultiValueField } from "@/components/molecules";
import { normalizeLandline, sanitizeLandlineInput } from "@/lib/phone";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type UnitFormUser = { id: string; firstName: string; lastName: string; phone: string };

export type UnitFormValue = {
  id: string;
  number: string;
  floor: number | null;
  areaM2: string | null;
  parkingCount: number;
  storageCount: number;
  electricityBillId: string | null;
  gasBillId: string | null;
  waterBillId: string | null;
  phoneLines: string[];
  propertyId: string | null;
  postalCode: string | null;
  residentCount: number;
  notes: string | null;
  ownerIds: string[];
  tenantIds: string[];
};

function UserChecks({
  name,
  users,
  selected,
}: {
  name: string;
  users: UnitFormUser[];
  selected: string[];
}) {
  if (!users.length) {
    return <p className="text-xs text-ink-faint">ابتدا از بخش کاربران، حساب بسازید.</p>;
  }
  return (
    <div className="grid max-h-40 gap-1 overflow-auto rounded-[var(--radius-md)] border border-border p-2">
      {users.map((user) => (
        <label key={`${name}-${user.id}`} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name={name}
            value={user.id}
            defaultChecked={selected.includes(user.id)}
            className="accent-accent"
          />
          <span>
            {`${user.firstName} ${user.lastName}`.trim()}
            <span className="mr-1 text-ink-faint" dir="ltr">
              {user.phone}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}

export function UnitForm({
  unit,
  users,
  onCancel,
}: {
  unit?: UnitFormValue;
  users: UnitFormUser[];
  onCancel?: () => void;
}) {
  const [state, action, pending] = useActionState(upsertUnitAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">{unit ? `ویرایش واحد ${unit.number}` : "واحد جدید"}</h2>
      <form action={action} className="grid gap-4 sm:grid-cols-2">
        {unit ? <input type="hidden" name="id" value={unit.id} /> : null}
        <FormField label="شماره واحد">
          <Input name="number" defaultValue={unit?.number} required />
        </FormField>
        <FormField label="طبقه">
          <Input name="floor" defaultValue={unit?.floor ?? ""} inputMode="numeric" />
        </FormField>
        <FormField label="متراژ">
          <Input name="areaM2" defaultValue={unit?.areaM2 ?? ""} inputMode="decimal" />
        </FormField>
        <FormField label="تعداد پارکینگ">
          <Input name="parkingCount" defaultValue={unit?.parkingCount ?? 0} inputMode="numeric" />
        </FormField>
        <FormField label="تعداد انباری">
          <Input name="storageCount" defaultValue={unit?.storageCount ?? 0} inputMode="numeric" />
        </FormField>
        <FormField label="شناسه قبض برق">
          <Input name="electricityBillId" defaultValue={unit?.electricityBillId ?? ""} dir="ltr" />
        </FormField>
        <FormField label="شناسه قبض گاز">
          <Input name="gasBillId" defaultValue={unit?.gasBillId ?? ""} dir="ltr" />
        </FormField>
        <FormField label="شناسه قبض آب">
          <Input name="waterBillId" defaultValue={unit?.waterBillId ?? ""} dir="ltr" />
        </FormField>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium text-ink">مالک</legend>
          <UserChecks name="ownerUser" users={users} selected={unit?.ownerIds ?? []} />
        </fieldset>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium text-ink">مستاجر</legend>
          <UserChecks name="tenantUser" users={users} selected={unit?.tenantIds ?? []} />
        </fieldset>
        <div className="sm:col-span-2">
          <FormField
            label="خطوط تلفن"
            htmlFor="unit-phone-lines"
            hint="شماره ۸ رقمی همین واحد، بدون کد شهر"
          >
            <MultiValueField
              id="unit-phone-lines"
              name="phoneLine"
              defaultValue={(unit?.phoneLines ?? []).map(normalizeLandline).filter(Boolean)}
              placeholder="مثلاً 22334455"
              addLabel="افزودن شماره"
              emptyLabel="هنوز خط تلفنی برای این واحد ثبت نشده"
              duplicateLabel="این شماره از قبل برای این واحد ثبت شده"
              invalidLabel="شماره تلفن ثابت باید ۸ رقم باشد"
              dir="ltr"
              inputMode="numeric"
              maxLength={11}
              formatInput={sanitizeLandlineInput}
              normalize={normalizeLandline}
            />
          </FormField>
        </div>
        <FormField label="شماره شناسایی ملک">
          <Input name="propertyId" defaultValue={unit?.propertyId ?? ""} dir="ltr" />
        </FormField>
        <FormField label="کد پستی ملک">
          <Input
            name="postalCode"
            defaultValue={unit?.postalCode ?? ""}
            dir="ltr"
            inputMode="numeric"
            maxLength={10}
            placeholder="۱۰ رقم"
          />
        </FormField>
        <FormField label="تعداد نفرات ساکن" hint="۰ یعنی واحد خالی است">
          <Select name="residentCount" defaultValue={String(unit?.residentCount ?? 0)}>
            {Array.from({ length: 11 }, (_, count) => (
              <option key={count} value={count}>
                {count === 0 ? "۰ (خالی)" : String(count)}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="یادداشت">
            <Textarea name="notes" defaultValue={unit?.notes ?? ""} />
          </FormField>
        </div>
        {state && "error" in state && state.error ? (
          <p className="text-sm text-danger sm:col-span-2">{state.error}</p>
        ) : null}
        {state && "ok" in state && state.ok ? (
          <p className="text-sm text-success sm:col-span-2">واحد ذخیره شد.</p>
        ) : null}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "در حال ذخیره..." : "ذخیره واحد"}
          </Button>
          {unit && onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              انصراف
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
