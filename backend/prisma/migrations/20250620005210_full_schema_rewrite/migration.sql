/*
  Warnings:

  - The values [ACCOUNT_UPDATE,SYSTEM_ALERT,CREDENTIAL_ISSUED,CLAIM_ATTESTED,SECURITY_ALERT] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `ctypeId` on the `CTypeRolePermission` table. All the data in the column will be lost.
  - You are about to drop the column `ctypeId` on the `Claim` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `Claim` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cTypeId,role]` on the table `CTypeRolePermission` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,role]` on the table `UserRole` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Attestation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cTypeId` to the `CTypeRolePermission` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cTypeId` to the `Claim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contents` to the `Claim` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Claim` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('ROLE_CHANGE', 'CLAIM_SUBMITTED', 'CLAIM_APPROVED', 'CLAIM_REJECTED');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "CTypeRolePermission" DROP CONSTRAINT "CTypeRolePermission_ctypeId_fkey";

-- DropForeignKey
ALTER TABLE "Claim" DROP CONSTRAINT "Claim_ctypeId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_userId_fkey";

-- DropIndex
DROP INDEX "CType_creatorId_idx";

-- DropIndex
DROP INDEX "CTypeRolePermission_ctypeId_role_key";

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "Attestation" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "CTypeRolePermission" DROP COLUMN "ctypeId",
ADD COLUMN     "cTypeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Claim" DROP COLUMN "ctypeId",
DROP COLUMN "data",
ADD COLUMN     "cTypeId" TEXT NOT NULL,
ADD COLUMN     "contents" JSONB NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "email",
DROP COLUMN "name",
DROP COLUMN "organizationId";

-- AlterTable
ALTER TABLE "UserRole" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sid" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_sid_key" ON "Session"("sid");

-- CreateIndex
CREATE UNIQUE INDEX "CTypeRolePermission_cTypeId_role_key" ON "CTypeRolePermission"("cTypeId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", "role");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_cTypeId_fkey" FOREIGN KEY ("cTypeId") REFERENCES "CType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CTypeRolePermission" ADD CONSTRAINT "CTypeRolePermission_cTypeId_fkey" FOREIGN KEY ("cTypeId") REFERENCES "CType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
