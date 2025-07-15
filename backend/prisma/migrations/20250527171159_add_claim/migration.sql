-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "ctypeId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "owner" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_ctypeId_fkey" FOREIGN KEY ("ctypeId") REFERENCES "CType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
