-- CreateEnum
CREATE TYPE "ChargeKind" AS ENUM ('GENERAL', 'RESERVE', 'OCCASIONAL');

-- CreateEnum
CREATE TYPE "ExpenseKind" AS ENUM ('CONSTANT', 'VARIABLE');

-- CreateEnum
CREATE TYPE "AmenityType" AS ENUM ('STORAGE', 'PARKING', 'OTHER');

-- AlterTable
ALTER TABLE "ChargeItem" ADD COLUMN "kind" "ChargeKind" NOT NULL DEFAULT 'GENERAL';
ALTER TABLE "ChargeItem" ALTER COLUMN "method" SET DEFAULT 'EQUAL';

UPDATE "ChargeItem" SET "kind" = 'RESERVE' WHERE "fund" = 'RESERVE';
UPDATE "ChargeItem" SET "kind" = 'GENERAL' WHERE "fund" = 'OPERATING' AND "name" = 'شارژ عمومی';
UPDATE "ChargeItem"
SET "kind" = 'OCCASIONAL'
WHERE "fund" = 'OPERATING' AND "name" <> 'شارژ عمومی' AND "kind" = 'GENERAL';

INSERT INTO "ChargeItem" ("id", "name", "kind", "fund", "method", "amount", "appliesTo", "parkingExtra", "isActive", "sortOrder")
SELECT concat('cgen_', substr(md5(random()::text), 1, 20)), 'شارژ عمومی', 'GENERAL', 'OPERATING', 'EQUAL', 0, 'ALL', 0, true, 1
WHERE NOT EXISTS (SELECT 1 FROM "ChargeItem" WHERE "kind" = 'GENERAL');

INSERT INTO "ChargeItem" ("id", "name", "kind", "fund", "method", "amount", "appliesTo", "parkingExtra", "isActive", "sortOrder")
SELECT concat('cres_', substr(md5(random()::text), 1, 20)), 'صندوق ذخیره مالکین', 'RESERVE', 'RESERVE', 'EQUAL', 0, 'OWNERS', 0, true, 1
WHERE NOT EXISTS (SELECT 1 FROM "ChargeItem" WHERE "kind" = 'RESERVE');

-- CreateTable
CREATE TABLE "ChargeExpense" (
    "id" TEXT NOT NULL,
    "chargeItemId" TEXT NOT NULL,
    "kind" "ExpenseKind" NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChargeExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildingAmenity" (
    "id" TEXT NOT NULL,
    "type" "AmenityType" NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyFee" DECIMAL(14,2) NOT NULL,
    "unitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildingAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OccasionalLevy" (
    "id" TEXT NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "note" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OccasionalLevy_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ChargeExpense" ADD CONSTRAINT "ChargeExpense_chargeItemId_fkey" FOREIGN KEY ("chargeItemId") REFERENCES "ChargeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuildingAmenity" ADD CONSTRAINT "BuildingAmenity_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccasionalLevy" ADD CONSTRAINT "OccasionalLevy_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "ChargeItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccasionalLevy" ADD CONSTRAINT "OccasionalLevy_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccasionalLevy" ADD CONSTRAINT "OccasionalLevy_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "BillingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
