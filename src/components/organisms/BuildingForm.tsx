"use client";

import { updateBuildingAction } from "@/actions/billing";
import { Button, Card, Input } from "@/components/atoms";
import { FormField } from "@/components/molecules";
import { useActionState } from "react";

export function BuildingForm({
  name,
  address,
  currency,
}: {
  name: string;
  address?: string | null;
  currency: string;
}) {
  const [state, action, pending] = useActionState(updateBuildingAction, null);
  return (
    <Card>
      <form action={action} className="grid gap-4">
        <FormField label="نام ساختمان">
          <Input name="name" defaultValue={name} required />
        </FormField>
        <FormField label="آدرس">
          <Input name="address" defaultValue={address ?? ""} />
        </FormField>
        <FormField label="واحد پول">
          <Input name="currency" defaultValue={currency} />
        </FormField>
        {state && "error" in state && state.error ? (
          <p className="text-sm text-danger">{state.error}</p>
        ) : null}
        {state && "ok" in state && state.ok ? (
          <p className="text-sm text-success">ذخیره شد.</p>
        ) : null}
        <Button type="submit" disabled={pending}>
          ذخیره تنظیمات
        </Button>
      </form>
    </Card>
  );
}
