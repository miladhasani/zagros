"use client";

import {
  createAnnouncementAction,
  createPlanAction,
  createUtilityBillAction,
} from "@/actions/landing";
import { uploadDocumentAction } from "@/actions/documents";
import { Button, Card, DatePicker, Input, MoneyInput, Textarea } from "@/components/atoms";
import { FormField } from "@/components/molecules";
import { useActionState } from "react";

function FormAlert({ state }: { state: { error?: string; ok?: boolean } | null }) {
  if (!state) return null;
  if ("error" in state && state.error) return <p className="text-sm text-danger">{state.error}</p>;
  return null;
}

export function AnnouncementForm() {
  const [state, action, pending] = useActionState(createAnnouncementAction, null);
  return (
    <Card>
      <h3 className="mb-3 font-semibold">خبر جدید</h3>
      <form action={action} className="grid gap-3">
        <FormField label="عنوان">
          <Input name="title" required />
        </FormField>
        <FormField label="متن">
          <Textarea name="body" required />
        </FormField>
        <FormAlert state={state} />
        <Button type="submit" disabled={pending}>
          انتشار خبر
        </Button>
      </form>
    </Card>
  );
}

export function UtilityBillForm() {
  const [state, action, pending] = useActionState(createUtilityBillAction, null);
  return (
    <Card>
      <h3 className="mb-3 font-semibold">قبض مشاع</h3>
      <form action={action} className="grid gap-3">
        <FormField label="نوع (آب، برق، گاز...)">
          <Input name="type" required />
        </FormField>
        <FormField label="دوره">
          <DatePicker name="periodLabel" granularity="month" required placeholder="انتخاب ماه" />
        </FormField>
        <FormField label="مبلغ">
          <MoneyInput name="amount" />
        </FormField>
        <FormField label="فایل">
          <Input name="file" type="file" />
        </FormField>
        <FormAlert state={state} />
        <Button type="submit" disabled={pending}>
          ثبت قبض
        </Button>
      </form>
    </Card>
  );
}

export function FuturePlanForm() {
  const [state, action, pending] = useActionState(createPlanAction, null);
  return (
    <Card>
      <h3 className="mb-3 font-semibold">برنامه آینده</h3>
      <form action={action} className="grid gap-3">
        <FormField label="عنوان">
          <Input name="title" required />
        </FormField>
        <FormField label="توضیح">
          <Textarea name="description" required />
        </FormField>
        <FormField label="زمان تقریبی">
          <DatePicker name="targetDate" />
        </FormField>
        <FormAlert state={state} />
        <Button type="submit" disabled={pending}>
          ثبت برنامه
        </Button>
      </form>
    </Card>
  );
}

export function DocumentForm() {
  const [state, action, pending] = useActionState(uploadDocumentAction, null);
  return (
    <Card>
      <h3 className="mb-3 font-semibold">بارگذاری سند</h3>
      <form action={action} className="grid gap-3">
        <FormField label="عنوان">
          <Input name="title" required />
        </FormField>
        <FormField label="توضیح">
          <Textarea name="description" />
        </FormField>
        <FormField label="فایل">
          <Input name="file" type="file" required />
        </FormField>
        <FormAlert state={state} />
        <Button type="submit" disabled={pending}>
          بارگذاری
        </Button>
      </form>
    </Card>
  );
}

export function DeleteButton({
  action,
  label = "حذف",
}: {
  action: () => Promise<void>;
  label?: string;
}) {
  return (
    <Button
      variant="danger"
      size="sm"
      onClick={async () => {
        if (confirm("حذف شود؟")) await action();
      }}
    >
      {label}
    </Button>
  );
}
