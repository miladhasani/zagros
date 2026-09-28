-- Rename electricity meter to electricity bill ID and add gas/water bill IDs.
ALTER TABLE "Unit" RENAME COLUMN "electricityMeter" TO "electricityBillId";
ALTER TABLE "Unit" ADD COLUMN "gasBillId" TEXT;
ALTER TABLE "Unit" ADD COLUMN "waterBillId" TEXT;
