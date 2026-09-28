"use client";

import { Button, Card, Input } from "@/components/atoms";
import { FormField } from "@/components/molecules";
import { sanitizeMobileInput } from "@/lib/phone";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError("");
    const phone = sanitizeMobileInput(String(formData.get("phone") ?? ""));
    const password = String(formData.get("password") ?? "");
    const result = await signIn("credentials", { phone, password, redirect: false });
    setPending(false);
    if (!result || result.error) {
      setError("شماره موبایل یا رمز عبور نادرست است");
      return;
    }
    const from = params.get("from") || "/panel";
    router.push(from);
    router.refresh();
  }

  return (
    <Card className="shadow-md">
      <h1 className="text-2xl font-bold text-ink">ورود به سامانه</h1>
      <p className="mt-1 text-sm text-ink-muted">حساب کاربری توسط مدیرکل ساخته می‌شود.</p>
      <form action={onSubmit} className="mt-6 grid gap-4">
        <FormField label="شماره موبایل" htmlFor="phone">
          <Input id="phone" name="phone" inputMode="numeric" placeholder="0912xxxxxxx" required dir="ltr" />
        </FormField>
        <FormField label="رمز عبور" htmlFor="password">
          <Input id="password" name="password" type="password" required dir="ltr" />
        </FormField>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "در حال ورود..." : "ورود"}
        </Button>
      </form>
    </Card>
  );
}
