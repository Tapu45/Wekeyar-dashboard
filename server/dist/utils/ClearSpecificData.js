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
                select: { id: true },
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
        const customersToDelete = await prisma.customer.findMany({
            where: {
                isCashlist: false,
                bills: {
                    none: {}
                }
            },
            select: { id: true }
        });
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
    finally {
        await prisma.$disconnect();
    }
}
async function main() {
    try {
        const result = await clearStoreDataByName("UNKNOWN STORE");
        console.log(result);
    }
    catch (error) {
        console.error(error);
    }
    finally {
        process.exit(0);
    }
}
main();
//# sourceMappingURL=ClearSpecificData.js.map