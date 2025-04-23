import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearSpecificData() {
  try {
    console.log('Starting to clear specific data...');

    // Define the date range for April 2025
    const startDate = new Date('2025-04-23T00:00:00.000Z');
    const endDate = new Date('2025-04-23T23:59:59.999Z');

    // Step 1: Find all bills in the specified date range
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
    const customerIdsToCheck = [...new Set(billsToDelete.map((bill) => bill.customerId))]; // Ensure unique customer IDs

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

    // Step 4: Find customers who only have bills in the specified date range
    console.log('Checking customers who only have bills in the specified date range...');
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
    if (customersToDelete.length > 0) {
      console.log('Deleting customers...');
      await prisma.customer.deleteMany({
        where: {
          id: {
            in: customersToDelete,
          },
        },
      });
      console.log('Deleted customers.');
    } else {
      console.log('No customers to delete.');
    }

    console.log('Specific data cleared successfully.');
  } catch (error) {
    console.error('Error clearing specific data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearSpecificData();

// async function deleteUnknownCustomers() {
//   try {
//     console.log('Starting to delete unknown customers...');

//     // Find all customers with name "Unknown Customer" and phone starting with "UNKNOWN-"
//     const unknownCustomers = await prisma.customer.findMany({
//       where: {
//         name: "Unknown Customer",
//         phone: {
//           startsWith: "Unknown-",
//         },
//       },
//       select: {
//         id: true,
//         name: true,
//         phone: true,
//       },
//     });

//     console.log(`Found ${unknownCustomers.length} unknown customers to delete.`);

//     if (unknownCustomers.length > 0) {
//       // Delete the customers
//       const customerIdsToDelete = unknownCustomers.map((customer) => customer.id);

//       await prisma.customer.deleteMany({
//         where: {
//           id: {
//             in: customerIdsToDelete,
//           },
//         },
//       });

//       console.log('Deleted unknown customers successfully.');
//     } else {
//       console.log('No unknown customers found to delete.');
//     }
//   } catch (error) {
//     console.error('Error deleting unknown customers:', error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }

// deleteUnknownCustomers();

// async function deleteCustomersWithNoBills() {
//   try {
//     console.log('Starting to delete customers with no bills...');

//     // Find all customers with no bills
//     const customersWithNoBills = await prisma.customer.findMany({
//       where: {
//         bills: {
//           none: {}, // No associated bills
//         },
//       },
//       select: {
//         id: true,
//         name: true,
//         phone: true,
//       },
//     });

//     console.log(`Found ${customersWithNoBills.length} customers with no bills to delete.`);

//     if (customersWithNoBills.length > 0) {
//       // Delete the customers
//       const customerIdsToDelete = customersWithNoBills.map((customer) => customer.id);

//       await prisma.customer.deleteMany({
//         where: {
//           id: {
//             in: customerIdsToDelete,
//           },
//         },
//       });

//       console.log('Deleted customers with no bills successfully.');
//     } else {
//       console.log('No customers with no bills found to delete.');
//     }
//   } catch (error) {
//     console.error('Error deleting customers with no bills:', error);
//   } finally {
//     await prisma.$disconnect();
//   }
// }



