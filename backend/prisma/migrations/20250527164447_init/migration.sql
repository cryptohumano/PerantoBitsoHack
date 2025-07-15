-- CreateTable
CREATE TABLE "CType" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "schema" JSONB NOT NULL,
    "network" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CType_hash_key" ON "CType"("hash");
