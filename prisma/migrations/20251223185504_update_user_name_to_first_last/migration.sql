/*
  Warnings:

  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add new columns as nullable first
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName" TEXT;

-- Step 2: Migrate existing data (split name into firstName and lastName)
UPDATE "User" 
SET 
  "firstName" = SPLIT_PART("name", ' ', 1),
  "lastName" = CASE 
    WHEN POSITION(' ' IN "name") > 0 
    THEN SUBSTRING("name" FROM POSITION(' ' IN "name") + 1)
    ELSE ''
  END
WHERE "firstName" IS NULL OR "lastName" IS NULL;

-- Step 3: Set default values for any remaining nulls
UPDATE "User" SET "firstName" = 'User' WHERE "firstName" IS NULL;
UPDATE "User" SET "lastName" = '' WHERE "lastName" IS NULL;

-- Step 4: Make columns NOT NULL
ALTER TABLE "User" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "lastName" SET NOT NULL;

-- Step 5: Drop the old name column
ALTER TABLE "User" DROP COLUMN IF EXISTS "name";
