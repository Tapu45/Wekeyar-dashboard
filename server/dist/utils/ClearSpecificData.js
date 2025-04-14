"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function deleteCustomersWithNoBills() {
    try {
        console.log('Starting to delete customers with no bills...');
        const customersWithNoBills = await prisma.customer.findMany({
            where: {
                bills: {
                    none: {},
                },
            },
            select: {
                id: true,
                name: true,
                phone: true,
            },
        });
        console.log(`Found ${customersWithNoBills.length} customers with no bills to delete.`);
        if (customersWithNoBills.length > 0) {
            const customerIdsToDelete = customersWithNoBills.map((customer) => customer.id);
            await prisma.customer.deleteMany({
                where: {
                    id: {
                        in: customerIdsToDelete,
                    },
                },
            });
            console.log('Deleted customers with no bills successfully.');
        }
        else {
            console.log('No customers with no bills found to delete.');
        }
    }
    catch (error) {
        console.error('Error deleting customers with no bills:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
deleteCustomersWithNoBills();
//# sourceMappingURL=ClearSpecificData.js.map