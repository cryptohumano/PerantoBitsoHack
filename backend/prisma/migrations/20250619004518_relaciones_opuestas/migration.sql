/*
  Warnings:

  - You are about to drop the column `hash` on the `CType` table. All the data in the column will be lost.
  - You are about to drop the column `network` on the `CType` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `CType` table. All the data in the column will be lost.
  - You are about to drop the column `owner` on the `Claim` table. All the data in the column will be lost.
  - You are about to drop the column `roles` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `_AttesterCtypes` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `creatorId` to the `CType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `CType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `Claim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Claim" DROP CONSTRAINT "Claim_owner_fkey";

-- DropForeignKey
ALTER TABLE "_AttesterCtypes" DROP CONSTRAINT "_AttesterCtypes_A_fkey";

-- DropForeignKey
ALTER TABLE "_AttesterCtypes" DROP CONSTRAINT "_AttesterCtypes_B_fkey";

-- DropIndex
DROP INDEX "CType_hash_key";

-- AlterTable
ALTER TABLE "CType" DROP COLUMN "hash",
DROP COLUMN "network",
DROP COLUMN "title",
ADD COLUMN     "creatorId" TEXT NOT NULL,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Claim" DROP COLUMN "owner",
ADD COLUMN     "ownerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "roles",
ADD COLUMN     "email" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "_AttesterCtypes";

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CType" ADD CONSTRAINT "CType_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CType" ADD CONSTRAINT "CType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
