"use client";

import { setPasswordAction } from "@/actions/auth";
import { Button, Card, Input } from "@/components/atoms";
import { FormField } from "@/components/molecules";
import { useActionState } from "react";

export function SetPasswordForm() {
  const [state, action, pending] = useActionState(setPasswordAction, null);

  return (
    <Card className="shadow-md">
      <h1 className="text-2xl font-bold text-ink">تعیین رمز عبور</h1>
      <p className="mt-1 text-sm text-ink-muted">برای ورودهای بعدی یک رمز شخصی انتخاب کنید.</p>
      <form action={action} className="mt-6 grid gap-4">
        <FormField label="رمز جدید" htmlFor="password">
          <Input id="password" name="password" type="password" minLength={8} required dir="ltr" />
        </FormField>
        <FormField label="تکرار رمز" htmlFor="confirm">
          <Input id="confirm" name="confirm" type="password" minLength={8} required dir="ltr" />
        </FormField>
        {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "در حال ذخیره..." : "ذخیره و ادامه"}
        </Button>
      </form>
    </Card>
  );
}
