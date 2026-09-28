-- AlterTable
ALTER TABLE "ExpenseCategory" ADD COLUMN "fund" "FundType" NOT NULL DEFAULT 'OPERATING';

-- AlterTable
ALTER TABLE "BuildingExpense" ADD COLUMN "fund" "FundType" NOT NULL DEFAULT 'OPERATING';

-- DropIndex
DROP INDEX "ExpenseCategory_name_key";

-- DropIndex
DROP INDEX "BuildingExpense_jalaliYear_jalaliMonth_idx";

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_fund_name_key" ON "ExpenseCategory"("fund", "name");

-- CreateIndex
CREATE INDEX "BuildingExpense_fund_jalaliYear_jalaliMonth_idx" ON "BuildingExpense"("fund", "jalaliYear", "jalaliMonth");

-- Seed reserve expense types (separate from charge types)
INSERT INTO "ExpenseCategory" ("id", "name", "fund", "sortOrder") VALUES
  ('expcat_res_major', 'تعمیرات اساسی', 'RESERVE', 1),
  ('expcat_res_facade', 'نما و سازه', 'RESERVE', 2),
  ('expcat_res_elevator', 'آسانسور', 'RESERVE', 3),
  ('expcat_res_roof', 'پشت‌بام و ایزوگام', 'RESERVE', 4),
  ('expcat_res_plumbing', 'لوله و تأسیسات', 'RESERVE', 5),
  ('expcat_res_other', 'سایر', 'RESERVE', 6);
