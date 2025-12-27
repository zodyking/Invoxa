-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN IF EXISTS "currentMileage";

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "registrationDocument" TEXT;

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "insuranceDocument" TEXT;