/*
  Warnings:

  - You are about to drop the column `customerType` on the `Customer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "customerType";

-- DropEnum
DROP TYPE "CustomerType";
