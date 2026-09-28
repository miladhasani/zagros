"use client";

import { updateProfileAction } from "@/actions/auth";
import { Button, Card, Input } from "@/components/atoms";
import { FormField, MultiValueField } from "@/components/molecules";
import { normalizeMobileField, sanitizeMobileInput } from "@/lib/phone";
import {
  formatCardNumber,
  normalizeCardField,
  sanitizeCardNumberInput,
  sanitizeNationalIdInput,
  userPhones,
} from "@/lib/user";
import { useActionState, useEffect, useState } from "react";

export function ProfileForm({
  firstName,
  lastName,
  phone,
  phones,
  nationalId,
  cardNumbers,
}: {
  firstName: string;
  lastName: string;
  phone: string;
  phones: string[];
  nationalId: string | null;
  cardNumbers: string[];
}) {
  const [state, action, pending] = useActionState(updateProfileAction, null);
  const [givenName, setGivenName] = useState(firstName);
  const [familyName, setFamilyName] = useState(lastName);
  const [nid, setNid] = useState(nationalId ?? "");

  useEffect(() => {
    setGivenName(firstName);
    setFamilyName(lastName);
    setNid(nationalId ?? "");
  }, [firstName, lastName, nationalId]);

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold">اطلاعات شخصی</h2>
      <form action={action} className="grid gap-4 sm:grid-cols-2">
        <FormField label="نام" htmlFor="firstName">
          <Input
            id="firstName"
            name="firstName"
            value={givenName}
            onChange={(event) => setGivenName(event.target.value)}
            required
          />
        </FormField>
        <FormField label="نام خانوادگی" htmlFor="lastName">
          <Input
            id="lastName"
            name="lastName"
            value={familyName}
            onChange={(event) => setFamilyName(event.target.value)}
            required
          />
        </FormField>
        <FormField label="کد ملی" htmlFor="nationalId">
          <Input
            id="nationalId"
            name="nationalId"
            value={nid}
            onChange={(event) => setNid(sanitizeNationalIdInput(event.target.value))}
            dir="ltr"
            inputMode="numeric"
            maxLength={10}
            placeholder="۱۰ رقم"
          />
        </FormField>
        <div className="sm:col-span-2">
          <FormField label="شماره موبایل" htmlFor="profile-phones">
            <MultiValueField
              id="profile-phones"
              name="phone"
              defaultValue={userPhones({ phone, phones })}
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
          <FormField label="شماره کارت" htmlFor="profile-cards">
            <MultiValueField
              id="profile-cards"
              name="cardNumber"
              defaultValue={cardNumbers}
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
        {state && "error" in state && state.error ? (
          <p className="text-sm text-danger sm:col-span-2">{state.error}</p>
        ) : null}
        {state && "ok" in state && state.ok ? (
          <p className="text-sm text-success sm:col-span-2">اطلاعات پروفایل ذخیره شد.</p>
        ) : null}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
