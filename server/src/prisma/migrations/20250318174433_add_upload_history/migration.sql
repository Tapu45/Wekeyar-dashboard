/*
  Warnings:

  - A unique constraint covering the columns `[storeName]` on the table `Store` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amountPaid` to the `Bill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creditAmount` to the `Bill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentType` to the `Bill` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expBatch` to the `BillDetails` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "amountPaid" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "creditAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "paymentType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "BillDetails" ADD COLUMN     "expBatch" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "UploadHistory" (
    "id" SERIAL NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Store_storeName_key" ON "Store"("storeName");
