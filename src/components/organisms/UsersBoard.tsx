"use client";

import { Badge, Button } from "@/components/atoms";
import { DataTable } from "@/components/organisms/DataTable";
import { UserForm, UserRowActions, type UserFormUnit, type UserFormValue } from "@/components/organisms/UserForms";
import { displayName, formatCardNumber } from "@/lib/user";
import { useCallback, useState } from "react";

export function UsersBoard({
  users,
  units,
}: {
  users: UserFormValue[];
  units: UserFormUnit[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [createdPassword, setCreatedPassword] = useState<{ name: string; password: string } | null>(null);
  const editing = users.find((user) => user.id === editingId);

  const resetForm = useCallback((result?: { password?: string; name?: string }) => {
    setEditingId(null);
    setFormKey((key) => key + 1);
    if (result?.password) {
      setCreatedPassword({ name: result.name ?? "", password: result.password });
    }
  }, []);

  return (
    <div className="grid gap-6">
      {createdPassword ? (
        <div className="rounded-[var(--radius-lg)] border border-accent bg-accent-soft p-4 text-accent-ink">
          <p>رمز یک‌بارمصرف برای {createdPassword.name}:</p>
          <p className="mt-1 font-mono text-xl tracking-widest" dir="ltr">
            {createdPassword.password}
          </p>
          <p className="mt-2 text-sm">این رمز فقط همین یک‌بار نمایش داده می‌شود. فرم زیر برای کاربر بعدی خالی است.</p>
        </div>
      ) : null}
      <UserForm
        key={`${editing?.id ?? "new"}-${formKey}`}
        user={editing}
        units={units}
        onCancel={editing ? () => setEditingId(null) : undefined}
        onSaved={resetForm}
      />
      <DataTable
        rows={users}
        rowKey={(row) => row.id}
        emptyTitle="کاربری ثبت نشده"
        mobileTitle={(row) => displayName(row)}
        columns={[
          { key: "firstName", header: "نام", render: (row) => row.firstName || "—" },
          { key: "lastName", header: "نام خانوادگی", render: (row) => row.lastName },
          {
            key: "phone",
            header: "شماره موبایل",
            render: (row) => (row.phones.length ? row.phones.join("، ") : row.phone),
          },
          { key: "nationalId", header: "کد ملی", render: (row) => row.nationalId ?? "—" },
          {
            key: "cardNumber",
            header: "شماره کارت",
            render: (row) =>
              row.cardNumbers.length
                ? row.cardNumbers.map(formatCardNumber).join("، ")
                : "—",
          },
          {
            key: "active",
            header: "وضعیت",
            render: (row) => (row.isActive ? "فعال" : "غیرفعال"),
          },
          {
            key: "roles",
            header: "نقش",
            render: (row) => (
              <div className="flex flex-wrap gap-1">
                {row.isSuperAdmin ? <Badge variant="accent">مدیرکل</Badge> : null}
                {row.isAdmin ? <Badge>هیئت مدیره</Badge> : null}
                {row.ownerUnitIds.map((id) => (
                  <Badge key={`o-${id}`} variant="success">
                    مالک {units.find((unit) => unit.id === id)?.number ?? ""}
                  </Badge>
                ))}
                {row.tenantUnitIds.map((id) => (
                  <Badge key={`t-${id}`} variant="success">
                    مستاجر {units.find((unit) => unit.id === id)?.number ?? ""}
                  </Badge>
                ))}
              </div>
            ),
          },
          {
            key: "actions",
            header: "عملیات",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCreatedPassword(null);
                    setEditingId(row.id);
                  }}
                >
                  ویرایش
                </Button>
                {row.isSuperAdmin ? null : <UserRowActions userId={row.id} />}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
