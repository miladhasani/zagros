"use client";

import { changePasswordAction } from "@/actions/auth";
import { Button, Card, Input } from "@/components/atoms";
import { FormField } from "@/components/molecules";
import { useActionState, useEffect, useRef } from "react";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Card className="max-w-lg">
      <form ref={formRef} action={action} className="grid gap-4">
        <FormField label="رمز فعلی" htmlFor="current">
          <Input id="current" name="current" type="password" required dir="ltr" autoComplete="current-password" />
        </FormField>
        <FormField label="رمز جدید" htmlFor="password" hint="حداقل ۸ کاراکتر">
          <Input
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
            dir="ltr"
            autoComplete="new-password"
          />
        </FormField>
        <FormField label="تکرار رمز جدید" htmlFor="confirm">
          <Input
            id="confirm"
            name="confirm"
            type="password"
            minLength={8}
            required
            dir="ltr"
            autoComplete="new-password"
          />
        </FormField>
        {state && "error" in state && state.error ? (
          <p className="text-sm text-danger">{state.error}</p>
        ) : null}
        {state && "ok" in state && state.ok ? (
          <p className="text-sm text-success">رمز عبور با موفقیت تغییر کرد.</p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "در حال ذخیره..." : "تغییر رمز عبور"}
        </Button>
      </form>
    </Card>
  );
}
