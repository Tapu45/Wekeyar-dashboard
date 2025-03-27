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

    console.log('Database cleared successfully.');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();