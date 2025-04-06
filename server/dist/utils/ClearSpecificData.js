"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function clearSpecificData() {
    try {
        console.log('Starting to clear specific data...');
        const startDate = new Date('2025-04-06T00:00:00.000Z');
        const endDate = new Date('2025-04-06T23:59:59.999Z');
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
        console.log('Deleting related BillDetails...');
        await prisma.billDetails.deleteMany({
            where: {
                billId: {
                    in: billIdsToDelete,
                },
            },
        });
        console.log('Deleted related BillDetails.');
        console.log('Deleting bills...');
        await prisma.bill.deleteMany({
            where: {
                id: {
                    in: billIdsToDelete,
                },
            },
        });
        console.log('Deleted bills.');
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
    }
    catch (error) {
        console.error('Error clearing specific data:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
clearSpecificData();
//# sourceMappingURL=ClearSpecificData.js.map