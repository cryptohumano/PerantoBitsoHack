-- AlterTable
ALTER TABLE "IdentityRequest" ADD COLUMN     "kiltBlockHash" TEXT,
ADD COLUMN     "kiltBlockNumber" INTEGER,
ADD COLUMN     "kiltNetwork" "KiltNetwork",
ADD COLUMN     "kiltSentAt" TIMESTAMP(3);
