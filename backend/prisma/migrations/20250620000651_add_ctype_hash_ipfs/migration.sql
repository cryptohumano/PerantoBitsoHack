/*
  Warnings:

  - Made the column `ctypeHash` on table `CType` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CType" ALTER COLUMN "isPublic" SET DEFAULT true,
ALTER COLUMN "ctypeHash" SET NOT NULL;

-- CreateIndex
CREATE INDEX "CType_creatorId_idx" ON "CType"("creatorId");
