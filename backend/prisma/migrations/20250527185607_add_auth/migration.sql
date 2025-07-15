-- AlterTable
ALTER TABLE "_AttesterCtypes" ADD CONSTRAINT "_AttesterCtypes_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_AttesterCtypes_AB_unique";
