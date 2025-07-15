-- CreateEnum
CREATE TYPE "CTypeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'REVOKED');

-- AlterTable
ALTER TABLE "CType" ADD COLUMN     "blockHash" TEXT,
ADD COLUMN     "blockNumber" INTEGER,
ADD COLUMN     "status" "CTypeStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "transactionHash" TEXT;
