-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildingExpense" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "transactionNumber" TEXT,
    "jalaliYear" INTEGER NOT NULL,
    "jalaliMonth" INTEGER NOT NULL,
    "filePath" TEXT,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedById" TEXT NOT NULL,

    CONSTRAINT "BuildingExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_name_key" ON "ExpenseCategory"("name");

-- CreateIndex
CREATE INDEX "BuildingExpense_jalaliYear_jalaliMonth_idx" ON "BuildingExpense"("jalaliYear", "jalaliMonth");

-- AddForeignKey
ALTER TABLE "BuildingExpense" ADD CONSTRAINT "BuildingExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingExpense" ADD CONSTRAINT "BuildingExpense_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed default categories
INSERT INTO "ExpenseCategory" ("id", "name", "sortOrder") VALUES
  ('expcat_repair', 'نگهداری و تعمیرات', 1),
  ('expcat_utility', 'قبض مشاع', 2),
  ('expcat_cleaning', 'نظافت', 3),
  ('expcat_garden', 'باغبانی', 4),
  ('expcat_purchase', 'خرید وسایل', 5),
  ('expcat_insurance', 'بیمه', 6),
  ('expcat_invoice', 'فاکتور خرید', 7),
  ('expcat_other', 'سایر', 8);

-- Move existing vendor invoices into monthly expenses
INSERT INTO "BuildingExpense" (
  "id",
  "categoryId",
  "description",
  "amount",
  "paidAt",
  "transactionNumber",
  "jalaliYear",
  "jalaliMonth",
  "filePath",
  "fileName",
  "createdAt",
  "recordedById"
)
SELECT
  "id",
  'expcat_invoice',
  TRIM(BOTH FROM CONCAT("title", CASE WHEN "vendor" IS NOT NULL AND "vendor" <> '' THEN CONCAT(' — ', "vendor") ELSE '' END)),
  COALESCE("amount", 0),
  "createdAt",
  NULL,
  1405,
  6,
  "filePath",
  "fileName",
  "createdAt",
  "uploadedById"
FROM "VendorInvoice";

-- DropTable
ALTER TABLE "VendorInvoice" DROP CONSTRAINT "VendorInvoice_uploadedById_fkey";
DROP TABLE "VendorInvoice";
