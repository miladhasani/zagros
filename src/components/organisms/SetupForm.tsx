"use client";

import { completeSetupAction } from "@/actions/auth";
import { Button, Card, Input, Textarea } from "@/components/atoms";
import { FormField, PageHeader } from "@/components/molecules";
import { useActionState } from "react";

export function SetupForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState(completeSetupAction, null);

  return (
    <>
      <PageHeader
        title="راه‌اندازی ساختمان"
        description="این اطلاعات برای هر مجتمع جداگانه تنظیم می‌شود."
      />
      <Card>
        <form action={action} className="grid gap-4">
          <FormField label="نام ساختمان">
            <Input name="name" defaultValue={defaultName} required />
          </FormField>
          <FormField label="آدرس">
            <Input name="address" />
          </FormField>
          <FormField label="واحد پول" hint="معمولاً تومان">
            <Input name="currency" defaultValue="تومان" />
          </FormField>
          <FormField
            label="واحدها"
            hint="هر خط یک واحد. می‌توانید بنویسید: ۱۰۱ یا ۱۰۱,۱,۱۲۰ (شماره، طبقه، متراژ)"
          >
            <Textarea name="units" rows={8} placeholder={"101,1,120\n102,1,95"} />
          </FormField>
          {state?.error ? <p className="text-sm text-danger">{state.error}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? "در حال ذخیره..." : "پایان راه‌اندازی"}
          </Button>
        </form>
      </Card>
    </>
  );
}
