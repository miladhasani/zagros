import { PageHeader } from "@/components/molecules";
import { ExpensesBoard } from "@/components/organisms/ExpensesBoard";
import { canSeeReserve } from "@/lib/access";
import { ensureExpenseCategories } from "@/lib/expenses";
import { currentJalali } from "@/lib/jalali";
import { prisma } from "@/lib/prisma";
import { userWithAccess } from "@/lib/session";
import { FundType } from "@prisma/client";
import { redirect } from "next/navigation";

export async function ExpenseStatement({
  fund,
  title,
  description,
  printTitle,
  reportHint,
  searchParams,
}: {
  fund: FundType;
  title: string;
  description: string;
  printTitle: string;
  reportHint: string;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { access, building } = await userWithAccess();
  if (fund === "RESERVE" && !canSeeReserve(access)) redirect("/panel");
  await ensureExpenseCategories();
  const query = await searchParams;
  const now = currentJalali();
  const year = Number(query.year) || now.year;
  const month = Number(query.month) || now.month;
  const currency = building?.currency ?? "تومان";

  const [categories, expenses] = await Promise.all([
    prisma.expenseCategory.findMany({
      where: { fund, isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    prisma.buildingExpense.findMany({
      where: { fund, jalaliYear: year, jalaliMonth: month },
      include: { category: true },
      orderBy: { paidAt: "asc" },
    }),
  ]);

  return (
    <>
      <div className="print:hidden">
        <PageHeader title={title} description={description} />
      </div>
      <ExpensesBoard
        fund={fund}
        currency={currency}
        buildingName={building?.name ?? "ساختمان"}
        year={year}
        month={month}
        categories={categories}
        expenses={expenses.map((row) => ({
          id: row.id,
          categoryName: row.category.name,
          description: row.description,
          amount: String(row.amount),
          paidAt: row.paidAt.toISOString(),
          transactionNumber: row.transactionNumber,
          filePath: row.filePath,
        }))}
        isStaff={access.isStaff}
        printTitle={printTitle}
        reportHint={reportHint}
      />
    </>
  );
}
