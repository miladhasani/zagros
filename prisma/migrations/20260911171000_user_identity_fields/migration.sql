-- Split the single name field and add national ID / bank card.
ALTER TABLE "User" ADD COLUMN "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN "lastName" TEXT;
ALTER TABLE "User" ADD COLUMN "nationalId" TEXT;
ALTER TABLE "User" ADD COLUMN "cardNumber" TEXT;

UPDATE "User"
SET
  "firstName" = split_part(btrim("fullName"), ' ', 1),
  "lastName" = CASE
    WHEN strpos(btrim("fullName"), ' ') = 0 THEN ''
    ELSE btrim(substr(btrim("fullName"), strpos(btrim("fullName"), ' ') + 1))
  END;

ALTER TABLE "User" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "lastName" SET NOT NULL;
ALTER TABLE "User" DROP COLUMN "fullName";

CREATE UNIQUE INDEX "User_nationalId_key" ON "User"("nationalId");
