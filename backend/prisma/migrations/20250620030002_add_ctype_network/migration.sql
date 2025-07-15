/*
  Warnings:

  - Added the required column `network` to the `CType` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "KiltNetwork" AS ENUM ('SPIRITNET', 'PEREGRINE');

-- AlterTable
ALTER TABLE "CType" ADD COLUMN     "network" "KiltNetwork" NOT NULL;
