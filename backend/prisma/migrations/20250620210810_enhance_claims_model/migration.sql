/*
  Warnings:

  - Added the required column `network` to the `Claim` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED');

-- AlterTable
ALTER TABLE "Claim" ADD COLUMN     "attestedAt" TIMESTAMP(3),
ADD COLUMN     "blockHash" TEXT,
ADD COLUMN     "blockNumber" INTEGER,
ADD COLUMN     "ipfsCid" TEXT,
ADD COLUMN     "network" "KiltNetwork" NOT NULL,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "transactionHash" TEXT;

-- CreateIndex
CREATE INDEX "Claim_status_idx" ON "Claim"("status");

-- CreateIndex
CREATE INDEX "Claim_ownerId_idx" ON "Claim"("ownerId");

-- CreateIndex
CREATE INDEX "Claim_cTypeId_idx" ON "Claim"("cTypeId");

-- CreateIndex
CREATE INDEX "Claim_createdAt_idx" ON "Claim"("createdAt");
