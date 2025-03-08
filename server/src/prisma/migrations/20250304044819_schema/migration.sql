-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mobileNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "billNo" TEXT,
    "totalAmount" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_mobileNo_key" ON "Transaction"("mobileNo");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_billNo_key" ON "Transaction"("billNo");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
