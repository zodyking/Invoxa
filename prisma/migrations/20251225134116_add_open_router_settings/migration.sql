-- CreateTable
CREATE TABLE IF NOT EXISTS "OpenRouterSettings" (
    "id" TEXT NOT NULL,
    "apiKeyRef" TEXT,
    "defaultModel" TEXT NOT NULL DEFAULT 'openai/gpt-4o-mini',
    "maxTokens" INTEGER NOT NULL DEFAULT 4096,
    "temperature" DECIMAL(3,2) NOT NULL DEFAULT 0.7,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpenRouterSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "OpenRouterSettings_id_key" ON "OpenRouterSettings"("id");





