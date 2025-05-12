import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRemainingCustomers() {
  try {
    console.log('Checking remaining customers...');

    // Define the date range for November 2024
    const startDate = new Date('2025-01-01T00:00:00.000Z');
    const endDate = new Date('2025-01-31T23:59:59.999Z');

    // Step 1: Find all customers who had bills in November 2024
    const customersWithBillsInRange = await prisma.customer.findMany({
      where: {
        bills: {
          some: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        bills: {
          select: {
            id: true,
            date: true,
          },
        },
      },
    });

    console.log(`Found ${customersWithBillsInRange.length} customers with bills in the specified range.`);

    // Step 2: Check if these customers have bills outside the specified range
    const customersStillExist = [];
    for (const customer of customersWithBillsInRange) {
      const otherBills = await prisma.bill.findMany({
        where: {
          customerId: customer.id,
          date: {
            not: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      });

      if (otherBills.length > 0) {
        customersStillExist.push({
          id: customer.id,
          name: customer.name,
          otherBillsCount: otherBills.length,
        });
      }
    }

    if (customersStillExist.length > 0) {
      console.log('The following customers still exist and have bills outside the specified range:');
      console.table(customersStillExist);
    } else {
      console.log('No customers with bills in the specified range still exist.');
    }
  } catch (error) {
    console.error('Error checking remaining customers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRemainingCustomers();