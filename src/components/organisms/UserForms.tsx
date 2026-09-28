"use client";

import { resetUserPasswordAction, toggleUserAction, upsertUserAction } from "@/actions/users";
import { Button, Card, Input } from "@/components/atoms";
import { FormField, MultiValueField } from "@/components/molecules";
import { normalizeMobileField, sanitizeMobileInput } from "@/lib/phone";
import { formatCardNumber, normalizeCardField, sanitizeCardNumberInput, sanitizeNationalIdInput, userPhones } from "@/lib/user";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type UserFormUnit = { id: string; number: string };

export type UserFormValue = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  phones: string[];
  nationalId: string | null;
  cardNumbers: string[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isActive: boolean;
  ownerUnitIds: string[];
  tenantUnitIds: string[];
};

export function UserForm({
  user,
  units,
  onCancel,
  onSaved,
}: {
  user?: UserFormValue;
  units: UserFormUnit[];
  onCancel?: () => void;
  onSaved?: (result: { password?: string; name?: string }) => void;
}) {
  const [state, action, pending] = useActionState(upsertUserAction, null);
  const router = useRouter();
  const [nationalId, setNationalId] = useState(user?.nationalId ?? "");
  const savedFor = useRef<unknown>(null);

  useEffect(() => {
    if (!state || savedFor.current === state) return;
    const created = "password" in state && state.password;
    const updated = "ok" in state && state.ok;
    if (!created && !updated) return;
    savedFor.current = state;
    onSaved?.({
      password: created ? state.password : undefined,
      name: "name" in state ? state.name : undefined,
    });
    router.refresh();
  }, [state, router, onSaved]);

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">{user ? "ویرایش کاربر" : "کاربر جدید"}</h2>
      <form action={action} className="grid gap-4 sm:grid-cols-2">
        {user ? <input type="hidden" name="id" value={user.id} /> : null}
        <FormField label="نام">
          <Input name="firstName" defaultValue={user?.firstName} />
        </FormField>
        <FormField label="نام خانوادگی">
          <Input name="lastName" defaultValue={user?.lastName} required />
        </FormField>
        <FormField label="کد ملی">
          <Input
            name="nationalId"
            dir="ltr"
            inputMode="numeric"
            maxLength={10}
            placeholder="۱۰ رقم"
            value={nationalId}
            onChange={(event) => setNationalId(sanitizeNationalIdInput(event.target.value))}
          />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="شماره موبایل" htmlFor="user-phones">
            <MultiValueField
              id="user-phones"
              name="phone"
              defaultValue={user ? userPhones(user) : []}
              placeholder="0912xxxxxxx"
              addLabel="افزودن شماره"
              emptyLabel="هنوز شماره‌ای ثبت نشده"
              duplicateLabel="این شماره از قبل ثبت شده"
              invalidLabel="شماره موبایل معتبر نیست"
              dir="ltr"
              inputMode="numeric"
              maxLength={11}
              formatInput={sanitizeMobileInput}
              normalize={normalizeMobileField}
            />
          </FormField>
        </div>
        <div className="sm:col-span-2">
          <FormField label="شماره کارت" htmlFor="user-cards">
            <MultiValueField
              id="user-cards"
              name="cardNumber"
              defaultValue={user?.cardNumbers ?? []}
              placeholder="۱۶ رقم"
              addLabel="افزودن کارت"
              emptyLabel="هنوز کارتی ثبت نشده"
              duplicateLabel="این کارت از قبل ثبت شده"
              invalidLabel="شماره کارت معتبر نیست"
              dir="ltr"
              inputMode="numeric"
              maxLength={16}
              formatInput={sanitizeCardNumberInput}
              formatValue={formatCardNumber}
              normalize={normalizeCardField}
            />
          </FormField>
        </div>
        {units.length ? (
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-ink">مالک واحدها</legend>
              <UnitChecks name="ownerUnit" units={units} selected={user?.ownerUnitIds ?? []} />
            </fieldset>
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-ink">مستاجر واحدها</legend>
              <UnitChecks name="tenantUnit" units={units} selected={user?.tenantUnitIds ?? []} />
            </fieldset>
          </div>
        ) : (
          <p className="text-xs text-ink-faint sm:col-span-2">ابتدا از بخش واحدها، واحد بسازید.</p>
        )}
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            name="isAdmin"
            defaultChecked={user?.isAdmin}
            disabled={user?.isSuperAdmin}
            className="size-4 accent-accent"
          />
          عضو هیئت مدیره
        </label>
        {user?.isSuperAdmin ? <input type="hidden" name="isAdmin" value="on" /> : null}
        {state && "error" in state && state.error ? (
          <p className="text-sm text-danger sm:col-span-2">{state.error}</p>
        ) : null}
        {state && "ok" in state && state.ok ? (
          <p className="text-sm text-success sm:col-span-2">کاربر ذخیره شد.</p>
        ) : null}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "در حال ذخیره..." : user ? "ذخیره کاربر" : "ایجاد کاربر"}
          </Button>
          {user && onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              انصراف
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

function UnitChecks({
  name,
  units,
  selected,
}: {
  name: string;
  units: UserFormUnit[];
  selected: string[];
}) {
  return (
    <div className="grid max-h-40 gap-1 overflow-auto rounded-[var(--radius-md)] border border-border p-2">
      {units.map((unit) => (
        <label key={`${name}-${unit.id}`} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name={name}
            value={unit.id}
            defaultChecked={selected.includes(unit.id)}
            className="accent-accent"
          />
          واحد {unit.number}
        </label>
      ))}
    </div>
  );
}

export function UserRowActions({
  userId,
  onEdit,
}: {
  userId: string;
  onEdit?: () => void;
}) {
  const [password, setPassword] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap gap-2">
      {onEdit ? (
        <Button variant="outline" size="sm" onClick={onEdit}>
          ویرایش
        </Button>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          await toggleUserAction(userId);
        }}
      >
        فعال/غیرفعال
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={async () => {
          const result = await resetUserPasswordAction(userId);
          if (result && "password" in result && result.password) setPassword(result.password);
        }}
      >
        رمز جدید
      </Button>
      {password ? (
        <span className="font-mono text-xs text-accent-ink" dir="ltr">
          {password}
        </span>
      ) : null}
    </div>
  );
}
