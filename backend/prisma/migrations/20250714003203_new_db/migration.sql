-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('SPEI', 'MXNB');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('SPEI', 'MXNB');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IdentityRequestStatus" AS ENUM ('PENDING', 'PAID', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DidStatus" AS ENUM ('NOT_CREATED', 'CREATED', 'FAILED');

-- CreateEnum
CREATE TYPE "CredentialStatus" AS ENUM ('NOT_ISSUED', 'ISSUED', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'DID_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'CREDENTIAL_ISSUED';

-- CreateTable
CREATE TABLE "IdentityRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "paymentType" "PaymentType" NOT NULL,
    "paymentId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "status" "IdentityRequestStatus" NOT NULL DEFAULT 'PENDING',
    "didCreated" BOOLEAN NOT NULL DEFAULT false,
    "credentialIssued" BOOLEAN NOT NULL DEFAULT false,
    "kiltAddress" TEXT,
    "substrateAddress" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentityRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "type" "PaymentType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "userId" TEXT,
    "paymentReference" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "transactionHash" TEXT,
    "network" TEXT,
    "metadata" JSONB,
    "identityRequestId" TEXT,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingStatus" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "didStatus" "DidStatus" NOT NULL DEFAULT 'NOT_CREATED',
    "credentialStatus" "CredentialStatus" NOT NULL DEFAULT 'NOT_ISSUED',
    "kiltSent" BOOLEAN NOT NULL DEFAULT false,
    "kiltAmount" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "lastUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdentityRequest_paymentId_key" ON "IdentityRequest"("paymentId");

-- CreateIndex
CREATE INDEX "IdentityRequest_status_idx" ON "IdentityRequest"("status");

-- CreateIndex
CREATE INDEX "IdentityRequest_userId_idx" ON "IdentityRequest"("userId");

-- CreateIndex
CREATE INDEX "IdentityRequest_requestedAt_idx" ON "IdentityRequest"("requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_paymentReference_key" ON "PaymentEvent"("paymentReference");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_identityRequestId_key" ON "PaymentEvent"("identityRequestId");

-- CreateIndex
CREATE INDEX "PaymentEvent_status_idx" ON "PaymentEvent"("status");

-- CreateIndex
CREATE INDEX "PaymentEvent_userId_idx" ON "PaymentEvent"("userId");

-- CreateIndex
CREATE INDEX "PaymentEvent_detectedAt_idx" ON "PaymentEvent"("detectedAt");

-- CreateIndex
CREATE INDEX "PaymentEvent_paymentReference_idx" ON "PaymentEvent"("paymentReference");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingStatus_requestId_key" ON "OnboardingStatus"("requestId");

-- CreateIndex
CREATE INDEX "OnboardingStatus_requestId_idx" ON "OnboardingStatus"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_eventId_key" ON "WebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "WebhookEvent_eventType_idx" ON "WebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "WebhookEvent_processed_idx" ON "WebhookEvent"("processed");

-- CreateIndex
CREATE INDEX "WebhookEvent_receivedAt_idx" ON "WebhookEvent"("receivedAt");

-- AddForeignKey
ALTER TABLE "IdentityRequest" ADD CONSTRAINT "IdentityRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_identityRequestId_fkey" FOREIGN KEY ("identityRequestId") REFERENCES "IdentityRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
