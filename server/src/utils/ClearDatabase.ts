import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('Clearing database...');

    // Delete all records from dependent tables first
    await prisma.billDetails.deleteMany(); // Clear bill details
    await prisma.bill.deleteMany(); // Clear bills
    await prisma.customer.deleteMany(); // Clear customers
    await prisma.store.deleteMany(); // Clear stores
    await prisma.uploadHistory.deleteMany(); // Clear upload history

    console.log('Database cleared successfully.');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();

//npx ts-node d:\Nexus\wekeyardashboard\server\src\utils\ClearDatabase.ts