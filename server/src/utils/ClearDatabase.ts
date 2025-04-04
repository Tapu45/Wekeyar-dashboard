import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('Clearing database...');

    // Delete records from dependent tables first
    await prisma.billDetails.deleteMany(); // Clear bill details
    await prisma.bill.deleteMany(); // Clear bills
    await prisma.telecallingOrderDetails.deleteMany(); // Clear telecalling order details
    await prisma.telecallingOrder.deleteMany(); // Clear telecalling orders
    await prisma.telecallerHandledCustomer.deleteMany(); // Clear telecaller handled customers
    await prisma.telecallingCustomer.deleteMany(); // Clear telecalling customers
    await prisma.uploadHistory.deleteMany(); // Clear upload history
    await prisma.customer.deleteMany(); // Clear customers
    await prisma.store.deleteMany(); // Clear stores
    await prisma.product.deleteMany(); // Clear products
    await prisma.user.deleteMany(); // Clear users

    console.log('Resetting auto-increment IDs...');

    // Reset auto-increment IDs for each table
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "BillDetails_id_seq" RESTART WITH 1`);
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Bill_id_seq" RESTART WITH 1`);
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "TelecallingOrderDetails_id_seq" RESTART WITH 1`);
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "TelecallingOrder_id_seq" RESTART WITH 1`);
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "TelecallerHandledCustomer_id_seq" RESTART WITH 1`);
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "TelecallingCustomer_id_seq" RESTART WITH 1`);
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "UploadHistory_id_seq" RESTART WITH 1`);
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Customer_id_seq" RESTART WITH 1`);
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Store_id_seq" RESTART WITH 1`);
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Product_id_seq" RESTART WITH 1`);
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "User_id_seq" RESTART WITH 1`);

    console.log('Database cleared and auto-increment IDs reset successfully.');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();