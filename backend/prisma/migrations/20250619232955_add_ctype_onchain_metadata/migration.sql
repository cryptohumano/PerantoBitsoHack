/*
  Warnings:

  - A unique constraint covering the columns `[ctypeHash]` on the table `CType` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CType" ADD COLUMN     "ctypeHash" TEXT,
ADD COLUMN     "ipfsCid" TEXT;

-- CreateTable
CREATE TABLE "CTypeRolePermission" (
    "id" TEXT NOT NULL,
    "ctypeId" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "CTypeRolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CTypeRolePermission_ctypeId_role_key" ON "CTypeRolePermission"("ctypeId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "CType_ctypeHash_key" ON "CType"("ctypeHash");

-- AddForeignKey
ALTER TABLE "CTypeRolePermission" ADD CONSTRAINT "CTypeRolePermission_ctypeId_fkey" FOREIGN KEY ("ctypeId") REFERENCES "CType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
