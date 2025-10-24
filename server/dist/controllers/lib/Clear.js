"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearStoreDataByMonth = clearStoreDataByMonth;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function clearStoreDataByMonth({ storeName, month, year }) {
    try {
        if (month < 1 || month > 12) {
            return {
                success: false,
                message: 'Invalid month. Must be between 1 and 12.'
            };
        }
        const store = await prisma.store.findUnique({
            where: { storeName }
        });
        if (!store) {
            return {
                success: false,
                message: `Store '${storeName}' not found.`
            };
        }
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        console.log('🔍 Counting bills to delete...');
        const billCount = await prisma.bill.count({
            where: {
                storeId: store.id,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });
        if (billCount === 0) {
            return {
                success: true,
                message: `No bills found for store '${storeName}' in ${month}/${year}.`,
                deletedCounts: {
                    billDetails: 0,
                    bills: 0
                }
            };
        }
        console.log(`📊 Found ${billCount} bills to delete`);
        console.log('🗑️  Deleting bill details...');
        const deletedBillDetails = await prisma.billDetails.deleteMany({
            where: {
                bill: {
                    storeId: store.id,
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            }
        });
        console.log(`✅ Deleted ${deletedBillDetails.count} bill details`);
        console.log('🗑️  Deleting bills...');
        const deletedBills = await prisma.bill.deleteMany({
            where: {
                storeId: store.id,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            }
        });
        console.log(`✅ Deleted ${deletedBills.count} bills`);
        return {
            success: true,
            message: `Successfully deleted ${deletedBills.count} bills and ${deletedBillDetails.count} bill details for store '${storeName}' in ${month}/${year}.`,
            deletedCounts: {
                billDetails: deletedBillDetails.count,
                bills: deletedBills.count
            }
        };
    }
    catch (error) {
        console.error('Error clearing store data:', error);
        return {
            success: false,
            message: `Error clearing data: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}
async function main() {
    const STORE_NAME = 'SAMANTARAPUR';
    const MONTH = 5;
    const YEAR = 2024;
    console.log('🗑️  Starting data deletion process...');
    console.log(`📍 Store: ${STORE_NAME}`);
    console.log(`📅 Month/Year: ${MONTH}/${YEAR}`);
    console.log('⚠️  WARNING: This will permanently delete all bills and bill details!');
    console.log('');
    const result = await clearStoreDataByMonth({
        storeName: STORE_NAME,
        month: MONTH,
        year: YEAR
    });
    if (result.success) {
        console.log('\n✅', result.message);
        if (result.deletedCounts) {
            console.log(`   - Bills deleted: ${result.deletedCounts.bills}`);
            console.log(`   - Bill details deleted: ${result.deletedCounts.billDetails}`);
        }
    }
    else {
        console.log('\n❌', result.message);
    }
    await prisma.$disconnect();
}
if (require.main === module) {
    main()
        .then(() => {
        console.log('\n✅ Process completed successfully');
        process.exit(0);
    })
        .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=Clear.js.map