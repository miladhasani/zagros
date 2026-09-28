-- Store land lines as a list. Split any previous free-text values.
ALTER TABLE "Unit" ADD COLUMN "phoneLinesArr" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "Unit"
SET "phoneLinesArr" = COALESCE((
  SELECT ARRAY_AGG(line)
  FROM (
    SELECT DISTINCT trim(both FROM part) AS line
    FROM regexp_split_to_table(COALESCE("phoneLines", ''), E'[\\n,،]+') AS part
  ) pieces
  WHERE line <> ''
), ARRAY[]::TEXT[]);

ALTER TABLE "Unit" DROP COLUMN "phoneLines";
ALTER TABLE "Unit" RENAME COLUMN "phoneLinesArr" TO "phoneLines";
