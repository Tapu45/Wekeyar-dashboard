"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function checkRemainingCustomers() {
    try {
        console.log('Checking remaining customers...');
        const startDate = new Date('2024-11-01T00:00:00.000Z');
        const endDate = new Date('2024-11-30T23:59:59.999Z');
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
        }
        else {
            console.log('No customers with bills in the specified range still exist.');
        }
    }
    catch (error) {
        console.error('Error checking remaining customers:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
checkRemainingCustomers();
//# sourceMappingURL=CheckRemainingCustomers.js.map