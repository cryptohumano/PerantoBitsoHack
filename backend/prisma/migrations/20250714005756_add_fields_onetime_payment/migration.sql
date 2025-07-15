/*
  Warnings:

  - You are about to drop the column `paymentId` on the `IdentityRequest` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `IdentityRequest` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[bitsoPaymentId]` on the table `IdentityRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "IdentityRequest_paymentId_key";

-- DropIndex
DROP INDEX "IdentityRequest_status_idx";

-- AlterTable
ALTER TABLE "IdentityRequest" DROP COLUMN "paymentId",
DROP COLUMN "status",
ADD COLUMN     "beneficiary" TEXT,
ADD COLUMN     "bitsoPaymentId" TEXT,
ADD COLUMN     "clabe" TEXT,
ADD COLUMN     "expirationDate" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "IdentityRequest_bitsoPaymentId_key" ON "IdentityRequest"("bitsoPaymentId");

-- CreateIndex
CREATE INDEX "IdentityRequest_paymentStatus_idx" ON "IdentityRequest"("paymentStatus");

-- CreateIndex
CREATE INDEX "IdentityRequest_bitsoPaymentId_idx" ON "IdentityRequest"("bitsoPaymentId");
