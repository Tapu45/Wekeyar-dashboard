import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearSpecificData() {
  try {
    console.log('Starting to clear specific data...');

    // Define the date range for November 2024
    const startDate = new Date('2025-04-07T00:00:00.000Z');
    const endDate = new Date('2025-04-07T23:59:59.999Z');

    // Step 1: Find all bills in November 2024
    const billsToDelete = await prisma.bill.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        customerId: true,
      },
    });

    const billIdsToDelete = billsToDelete.map((bill) => bill.id);
    const customerIdsToCheck = billsToDelete.map((bill) => bill.customerId);

    console.log(`Found ${billIdsToDelete.length} bills to delete.`);

    // Step 2: Delete BillDetails for the selected bills
    console.log('Deleting related BillDetails...');
    await prisma.billDetails.deleteMany({
      where: {
        billId: {
          in: billIdsToDelete,
        },
      },
    });

    console.log('Deleted related BillDetails.');

    // Step 3: Delete the selected bills
    console.log('Deleting bills...');
    await prisma.bill.deleteMany({
      where: {
        id: {
          in: billIdsToDelete,
        },
      },
    });

    console.log('Deleted bills.');

    // Step 4: Find customers who only have bills in November 2024
    console.log('Checking customers who only have bills in November 2024...');
    const customersToDelete = [];
    for (const customerId of customerIdsToCheck) {
      const otherBills = await prisma.bill.findMany({
        where: {
          customerId,
          date: {
            not: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      });

      if (otherBills.length === 0) {
        customersToDelete.push(customerId);
      }
    }

    console.log(`Found ${customersToDelete.length} customers to delete.`);

    // Step 5: Delete the selected customers
    console.log('Deleting customers...');
    await prisma.customer.deleteMany({
      where: {
        id: {
          in: customersToDelete,
        },
      },
    });

    console.log('Deleted customers.');

    console.log('Specific data cleared successfully.');
  } catch (error) {
    console.error('Error clearing specific data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearSpecificData();