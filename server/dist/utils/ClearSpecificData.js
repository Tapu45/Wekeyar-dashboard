"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearStoreDataByName = clearStoreDataByName;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const CHUNK_SIZE = 100;
async function clearStoreDataByName(storeName) {
    try {
        const store = await prisma.store.findUnique({
            where: { storeName: storeName }
        });
        if (!store) {
            throw new Error(`Store "${storeName}" not found`);
        }
        let totalBillDetailsDeleted = 0;
        let totalBillsDeleted = 0;
        let totalCustomersDeleted = 0;
        while (true) {
            const billDetailsToDelete = await prisma.billDetails.findMany({
                where: {
                    bill: {
                        storeId: store.id
                    }
                },
                select: { id: true },
                take: CHUNK_SIZE
            });
            if (billDetailsToDelete.length === 0)
                break;
            const deleted = await prisma.billDetails.deleteMany({
                where: {
                    id: { in: billDetailsToDelete.map(bd => bd.id) }
                }
            });
            totalBillDetailsDeleted += deleted.count;
        }
        while (true) {
            const billsToDelete = await prisma.bill.findMany({
                where: { storeId: store.id },
                select: { id: true, customerId: true },
                take: CHUNK_SIZE
            });
            if (billsToDelete.length === 0)
                break;
            const deleted = await prisma.bill.deleteMany({
                where: {
                    id: { in: billsToDelete.map(b => b.id) }
                }
            });
            totalBillsDeleted += deleted.count;
        }
        const customersOfStore = await prisma.customer.findMany({
            where: {
                isCashlist: false,
                bills: {
                    some: {
                        storeId: store.id
                    }
                }
            },
            select: { id: true }
        });
        const customersToDelete = [];
        for (const customer of customersOfStore) {
            const billCount = await prisma.bill.count({
                where: {
                    customerId: customer.id
                }
            });
            if (billCount === 0) {
                customersToDelete.push(customer);
            }
        }
        if (customersToDelete.length > 0) {
            for (let i = 0; i < customersToDelete.length; i += CHUNK_SIZE) {
                const chunk = customersToDelete.slice(i, i + CHUNK_SIZE);
                const deleted = await prisma.customer.deleteMany({
                    where: {
                        id: {
                            in: chunk.map(c => c.id)
                        }
                    }
                });
                totalCustomersDeleted += deleted.count;
            }
        }
        await prisma.store.delete({
            where: { id: store.id }
        });
        const result = {
            storeName: store.storeName,
            billsDeleted: totalBillsDeleted,
            billDetailsDeleted: totalBillDetailsDeleted,
            customersDeleted: totalCustomersDeleted
        };
        console.log(`Store "${storeName}" data cleared successfully:`, result);
        return result;
    }
    catch (error) {
        console.error(`Error clearing store "${storeName}" data:`, error);
        throw error;
    }
}
async function main() {
    const storeNames = [
        "DR NIROJ MISHRA",
        "594",
        "DR. A SAHOO",
        "137",
        "DR LAXMIDHAR PARHI",
        "292",
        "DR SRIRAJ",
        "5DR SRIRAJ"
    ];
    for (const storeName of storeNames) {
        try {
            const result = await clearStoreDataByName(storeName);
            console.log(result);
        }
        catch (error) {
            console.error(`Failed to clear data for store "${storeName}":`, error);
        }
    }
    await prisma.$disconnect();
    process.exit(0);
}
main();
//# sourceMappingURL=ClearSpecificData.js.map