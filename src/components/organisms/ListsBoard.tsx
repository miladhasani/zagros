"use client";

import {
  createExpenseCategoryAction,
  deleteExpenseCategoryAction,
  renameExpenseCategoryAction,
  restoreExpenseCategoryAction,
} from "@/actions/expenses";
import { Badge, Button, Card, Input } from "@/components/atoms";
import { FormField } from "@/components/molecules";
import { DataTable } from "@/components/organisms/DataTable";
import { faDigits } from "@/lib/format";
import type { FundType } from "@prisma/client";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type ExpenseCategoryRow = {
  id: string;
  name: string;
  isActive: boolean;
  expenseCount: number;
};

export function ListsBoard({
  chargeCategories,
  reserveCategories,
}: {
  chargeCategories: ExpenseCategoryRow[];
  reserveCategories: ExpenseCategoryRow[];
}) {
  return (
    <div className="grid gap-8">
      <CategorySection
        fund="OPERATING"
        title="انواع هزینه شارژ"
        description="این مقادیر در صورت‌حساب هزینه‌های شارژ دیده می‌شوند. مالکان و مستأجران همان فهرست را می‌بینند. تغییر نام، هزینه‌های قبلی را به همان نوع وصل نگه می‌دارد."
        placeholder="مثلاً نظافت"
        categories={chargeCategories}
      />
      <CategorySection
        fund="RESERVE"
        title="انواع هزینه صندوق ذخیره"
        description="این مقادیر فقط در صورت‌حساب صندوق ذخیره دیده می‌شوند و مخصوص مالکان است. مستأجران به این فهرست دسترسی ندارند."
        placeholder="مثلاً تعمیرات اساسی"
        categories={reserveCategories}
      />
    </div>
  );
}

function CategorySection({
  fund,
  title,
  description,
  placeholder,
  categories,
}: {
  fund: FundType;
  title: string;
  description: string;
  placeholder: string;
  categories: ExpenseCategoryRow[];
}) {
  return (
    <div className="grid gap-6">
      <Card>
        <h2 className="mb-1 text-lg font-semibold">{title}</h2>
        <p className="mb-4 text-sm text-ink-muted">{description}</p>
        <AddCategoryForm fund={fund} placeholder={placeholder} />
      </Card>
      <CategoryTable categories={categories} />
    </div>
  );
}

function AddCategoryForm({ fund, placeholder }: { fund: FundType; placeholder: string }) {
  const [state, action, pending] = useActionState(createExpenseCategoryAction, null);
  const [formKey, setFormKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      setFormKey((key) => key + 1);
      router.refresh();
    }
  }, [state, router]);

  return (
    <form key={formKey} action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="fund" value={fund} />
      <div className="min-w-56 flex-1">
        <FormField label="نوع جدید">
          <Input name="name" required placeholder={placeholder} />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "در حال ثبت..." : "افزودن"}
      </Button>
      {state && "error" in state && state.error ? (
        <p className="w-full text-sm text-danger">{state.error}</p>
      ) : null}
    </form>
  );
}

function CategoryTable({ categories }: { categories: ExpenseCategoryRow[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="grid gap-3">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <DataTable
        rows={categories}
        rowKey={(row) => row.id}
        emptyTitle="هنوز نوعی تعریف نشده"
        emptyDescription="اولین نوع هزینه را از فرم بالا اضافه کنید."
        mobileTitle={(row) => row.name}
        columns={[
          {
            key: "name",
            header: "عنوان",
            render: (row) =>
              editingId === row.id ? (
                <form
                  className="flex flex-wrap items-center gap-2"
                  action={async (formData) => {
                    const result = await renameExpenseCategoryAction(formData);
                    if (result && "error" in result && result.error) {
                      setError(result.error);
                      return;
                    }
                    setError(null);
                    setEditingId(null);
                    router.refresh();
                  }}
                >
                  <input type="hidden" name="id" value={row.id} />
                  <Input name="name" defaultValue={row.name} required className="min-w-44" />
                  <Button type="submit" size="sm">
                    ذخیره
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                    انصراف
                  </Button>
                </form>
              ) : (
                row.name
              ),
          },
          {
            key: "usage",
            header: "هزینه‌های ثبت‌شده",
            render: (row) => faDigits(row.expenseCount),
          },
          {
            key: "status",
            header: "وضعیت",
            render: (row) =>
              row.isActive ? <Badge variant="success">فعال</Badge> : <Badge>خارج از فهرست</Badge>,
          },
          {
            key: "actions",
            header: "عملیات",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                {row.isActive ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setEditingId(row.id)}>
                      تغییر نام
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={async () => {
                        const message =
                          row.expenseCount > 0
                            ? `این نوع در ${faDigits(row.expenseCount)} هزینه استفاده شده. از فهرست حذف می‌شود ولی هزینه‌های قبلی همان نوع را نگه می‌دارند.`
                            : "این نوع از فهرست حذف شود؟";
                        if (!confirm(message)) return;
                        setError(null);
                        await deleteExpenseCategoryAction(row.id);
                        setEditingId(null);
                        router.refresh();
                      }}
                    >
                      حذف
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      await restoreExpenseCategoryAction(row.id);
                      router.refresh();
                    }}
                  >
                    بازگردانی به فهرست
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
