-- CreateTable
CREATE TABLE "Attestation" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "attester" TEXT NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attestation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
