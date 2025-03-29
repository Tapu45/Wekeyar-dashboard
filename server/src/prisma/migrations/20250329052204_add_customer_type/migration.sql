-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('REGULAR', 'CASHLIST');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "customerType" "CustomerType" NOT NULL DEFAULT 'REGULAR';

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelecallingCustomer" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "storeName" TEXT,
    "lastPurchaseDate" TIMESTAMP(3),
    "remarks" TEXT,
    "status" TEXT NOT NULL DEFAULT 'not send',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelecallingCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelecallingOrder" (
    "id" SERIAL NOT NULL,
    "telecallingCustomerId" INTEGER NOT NULL,
    "telecallerId" INTEGER NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelecallingOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelecallingOrderDetails" (
    "id" SERIAL NOT NULL,
    "telecallingOrderId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "isNewProduct" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelecallingOrderDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelecallerHandledCustomer" (
    "id" SERIAL NOT NULL,
    "telecallerId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "handledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelecallerHandledCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TelecallingCustomer_customerId_key" ON "TelecallingCustomer"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");

-- AddForeignKey
ALTER TABLE "TelecallingOrder" ADD CONSTRAINT "TelecallingOrder_telecallingCustomerId_fkey" FOREIGN KEY ("telecallingCustomerId") REFERENCES "TelecallingCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelecallingOrder" ADD CONSTRAINT "TelecallingOrder_telecallerId_fkey" FOREIGN KEY ("telecallerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelecallingOrderDetails" ADD CONSTRAINT "TelecallingOrderDetails_telecallingOrderId_fkey" FOREIGN KEY ("telecallingOrderId") REFERENCES "TelecallingOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelecallerHandledCustomer" ADD CONSTRAINT "TelecallerHandledCustomer_telecallerId_fkey" FOREIGN KEY ("telecallerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelecallerHandledCustomer" ADD CONSTRAINT "TelecallerHandledCustomer_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "TelecallingCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
