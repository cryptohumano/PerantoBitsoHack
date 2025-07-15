/*
  Warnings:

  - You are about to drop the column `attester` on the `Attestation` table. All the data in the column will be lost.
  - Added the required column `attesterId` to the `Attestation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ctypeId` to the `Attestation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ATTESTER', 'ADMIN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "did" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AttesterCtypes" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_did_key" ON "User"("did");

-- CreateIndex
CREATE UNIQUE INDEX "_AttesterCtypes_AB_unique" ON "_AttesterCtypes"("A", "B");

-- CreateIndex
CREATE INDEX "_AttesterCtypes_B_index" ON "_AttesterCtypes"("B");

-- Migrate existing data
INSERT INTO "User" ("id", "did", "role", "createdAt")
SELECT 
    gen_random_uuid(),
    attester,
    'ATTESTER',
    CURRENT_TIMESTAMP
FROM "Attestation"
GROUP BY attester;

-- Update Attestation table
ALTER TABLE "Attestation" 
ADD COLUMN "attesterId" TEXT,
ADD COLUMN "ctypeId" TEXT;

-- Update Attestation with new foreign keys
UPDATE "Attestation" a
SET 
    "attesterId" = u.id,
    "ctypeId" = c.id
FROM "User" u, "Claim" cl, "CType" c
WHERE a.attester = u.did
AND a."claimId" = cl.id
AND cl."ctypeId" = c.id;

-- Make columns required
ALTER TABLE "Attestation" 
ALTER COLUMN "attesterId" SET NOT NULL,
ALTER COLUMN "ctypeId" SET NOT NULL;

-- Add foreign keys after data migration
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_owner_fkey" FOREIGN KEY ("owner") REFERENCES "User"("did") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_attesterId_fkey" FOREIGN KEY ("attesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_ctypeId_fkey" FOREIGN KEY ("ctypeId") REFERENCES "CType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "_AttesterCtypes" ADD CONSTRAINT "_AttesterCtypes_A_fkey" FOREIGN KEY ("A") REFERENCES "CType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_AttesterCtypes" ADD CONSTRAINT "_AttesterCtypes_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old column
ALTER TABLE "Attestation" DROP COLUMN "attester";
