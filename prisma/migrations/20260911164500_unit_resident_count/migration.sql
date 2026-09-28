-- Replace occupancy enum with resident count (0 = vacant).
ALTER TABLE "Unit" ADD COLUMN "residentCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "Unit" SET "residentCount" = 1 WHERE "status" = 'OCCUPIED';
UPDATE "Unit" SET "residentCount" = 0 WHERE "status" = 'VACANT';

ALTER TABLE "Unit" DROP COLUMN "status";

DROP TYPE "UnitStatus";
