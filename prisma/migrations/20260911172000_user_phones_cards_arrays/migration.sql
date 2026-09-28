-- A user can have several mobiles and bank cards.
ALTER TABLE "User" ADD COLUMN "phones" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ADD COLUMN "cardNumbers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "User" SET "phones" = ARRAY["phone"];

UPDATE "User"
SET "cardNumbers" = CASE
  WHEN "cardNumber" IS NULL OR btrim("cardNumber") = '' THEN ARRAY[]::TEXT[]
  ELSE ARRAY["cardNumber"]
END;

ALTER TABLE "User" DROP COLUMN "cardNumber";
