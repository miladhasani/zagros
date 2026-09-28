import { PageHeader } from "@/components/molecules";
import { ListsBoard } from "@/components/organisms/ListsBoard";
import { ensureExpenseCategories } from "@/lib/expenses";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

function toRows(
  categories: {
    id: string;
    name: string;
    isActive: boolean;
    _count: { expenses: number };
  }[],
) {
  return categories.map((row) => ({
    id: row.id,
    name: row.name,
    isActive: row.isActive,
    expenseCount: row._count.expenses,
  }));
}

export default async function ListsPage() {
  await requireAdmin();
  await ensureExpenseCategories();

  const categories = await prisma.expenseCategory.findMany({
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { expenses: true } } },
  });

  return (
    <>
      <PageHeader
        title="فهرست‌ها"
        description="مقادیر فهرست‌های کشویی شارژ و صندوق ذخیره را جداگانه تعریف کنید. تغییر نام، ارجاع رکوردهای قبلی را عوض نمی‌کند."
      />
      <ListsBoard
        chargeCategories={toRows(categories.filter((row) => row.fund === "OPERATING"))}
        reserveCategories={toRows(categories.filter((row) => row.fund === "RESERVE"))}
      />
    </>
  );
}
