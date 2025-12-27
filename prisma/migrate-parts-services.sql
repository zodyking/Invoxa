-- Migration script to merge Part and Service into CatalogItem
-- Run this BEFORE applying the schema changes

-- Step 1: Create Category table and merge PartCategory and ServiceCategory
CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");
CREATE INDEX IF NOT EXISTS "Category_name_idx" ON "Category"("name");

-- Migrate PartCategory data
INSERT INTO "Category" ("id", "name", "description", "createdAt", "updatedAt")
SELECT "id", "name", "description", "createdAt", "updatedAt"
FROM "PartCategory"
ON CONFLICT ("name") DO NOTHING;

-- Migrate ServiceCategory data (merge with PartCategory if names match, otherwise insert)
INSERT INTO "Category" ("id", "name", "description", "createdAt", "updatedAt")
SELECT 
  COALESCE(pc."id", sc."id"),
  sc."name",
  COALESCE(pc."description", sc."description"),
  LEAST(COALESCE(pc."createdAt", sc."createdAt"), sc."createdAt"),
  GREATEST(COALESCE(pc."updatedAt", sc."updatedAt"), sc."updatedAt")
FROM "ServiceCategory" sc
LEFT JOIN "PartCategory" pc ON pc."name" = sc."name"
ON CONFLICT ("name") DO NOTHING;

-- Step 2: Create CatalogItem table
CREATE TABLE IF NOT EXISTS "CatalogItem" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "name" TEXT,
  "code" TEXT,
  "partNumber" TEXT,
  "description" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "cost" DECIMAL(10,2),
  "categoryId" TEXT,
  "manufacturer" TEXT,
  "location" TEXT,
  "trackInventory" BOOLEAN NOT NULL DEFAULT false,
  "quantityOnHand" INTEGER,
  "minQuantity" INTEGER,
  "defaultHours" DECIMAL(5,2),
  "isFlatRate" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'active',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CatalogItem_code_key" ON "CatalogItem"("code");
CREATE INDEX IF NOT EXISTS "CatalogItem_type_idx" ON "CatalogItem"("type");
CREATE INDEX IF NOT EXISTS "CatalogItem_code_idx" ON "CatalogItem"("code");
CREATE INDEX IF NOT EXISTS "CatalogItem_partNumber_idx" ON "CatalogItem"("partNumber");
CREATE INDEX IF NOT EXISTS "CatalogItem_categoryId_idx" ON "CatalogItem"("categoryId");
CREATE INDEX IF NOT EXISTS "CatalogItem_status_idx" ON "CatalogItem"("status");

-- Migrate Part data
INSERT INTO "CatalogItem" (
  "id", "type", "name", "code", "partNumber", "description", "price", "cost",
  "categoryId", "manufacturer", "location", "trackInventory", "quantityOnHand",
  "minQuantity", "status", "notes", "createdAt", "updatedAt"
)
SELECT 
  "id",
  'part' as "type",
  NULL as "name",
  "partNumber" as "code",
  "partNumber",
  "description",
  "unitPrice" as "price",
  "cost",
  "categoryId",
  "manufacturer",
  "location",
  "trackInventory",
  "quantityOnHand",
  "minQuantity",
  "status",
  "notes",
  "createdAt",
  "updatedAt"
FROM "Part";

-- Migrate Service data
INSERT INTO "CatalogItem" (
  "id", "type", "name", "code", "description", "price", "categoryId",
  "defaultHours", "isFlatRate", "status", "notes", "createdAt", "updatedAt"
)
SELECT 
  "id",
  'service' as "type",
  "name",
  "code",
  COALESCE("description", '') as "description",
  "rate" as "price",
  "categoryId",
  "defaultHours",
  "isFlatRate",
  "status",
  "notes",
  "createdAt",
  "updatedAt"
FROM "Service";

-- Step 3: Update PackageItem to reference CatalogItem
-- First, add the new column
ALTER TABLE "PackageItem" ADD COLUMN IF NOT EXISTS "catalogItemId" TEXT;

-- Migrate PackageItem data
-- For parts
UPDATE "PackageItem" pi
SET "catalogItemId" = pi."partId"
WHERE pi."type" = 'part' AND pi."partId" IS NOT NULL;

-- For services
UPDATE "PackageItem" pi
SET "catalogItemId" = pi."serviceId"
WHERE pi."type" = 'service' AND pi."serviceId" IS NOT NULL;

-- Add foreign key constraint (will be done by Prisma schema)
-- ALTER TABLE "PackageItem" ADD CONSTRAINT "PackageItem_catalogItemId_fkey" 
--   FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE CASCADE;

-- Update categoryId in CatalogItem to use merged Category table
-- Map old PartCategory IDs to new Category IDs
UPDATE "CatalogItem" ci
SET "categoryId" = c."id"
FROM "PartCategory" pc
JOIN "Category" c ON c."name" = pc."name"
WHERE ci."categoryId" = pc."id" AND ci."type" = 'part';

-- Map old ServiceCategory IDs to new Category IDs
UPDATE "CatalogItem" ci
SET "categoryId" = c."id"
FROM "ServiceCategory" sc
JOIN "Category" c ON c."name" = sc."name"
WHERE ci."categoryId" = sc."id" AND ci."type" = 'service';

-- Update Package categoryId
UPDATE "Package" p
SET "categoryId" = c."id"
FROM "ServiceCategory" sc
JOIN "Category" c ON c."name" = sc."name"
WHERE p."categoryId" = sc."id";





