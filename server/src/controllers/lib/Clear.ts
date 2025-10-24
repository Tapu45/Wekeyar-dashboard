import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ClearDataParams {
    storeName: string;
    month: number; // 1-12
    year: number;
}

export async function clearStoreDataByMonth({
    storeName,
    month,
    year
}: ClearDataParams): Promise<{
    success: boolean;
    message: string;
    deletedCounts?: {
        billDetails: number;
        bills: number;
    };
}> {
    try {
        // Validate month
        if (month < 1 || month > 12) {
            return {
                success: false,
                message: 'Invalid month. Must be between 1 and 12.'
            };
        }

        // Find the store
        const store = await prisma.store.findUnique({
            where: { storeName }
        });

        if (!store) {
            return {
                success: false,
                message: `Store '${storeName}' not found.`
            };
        }

        // Calculate date range for the given month and year
        const startDate = new Date(year, month - 1, 1); // First day of the month
        const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month

        console.log('🔍 Counting bills to delete...');

        // Count bills first
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

        // Delete bill details first (without transaction for large datasets)
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

        // Delete bills
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

    } catch (error) {
        console.error('Error clearing store data:', error);
        return {
            success: false,
            message: `Error clearing data: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

// Main execution function - runs when file is executed directly
async function main() {
    // ====================================
    // CONFIGURE YOUR DELETION HERE
    // ====================================
    const STORE_NAME = 'SAMANTARAPUR';  // Change this to your store name
    const MONTH = 5;                       // Change this (1-12)
    const YEAR = 2024;                      // Change this
    // ====================================

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
    } else {
        console.log('\n❌', result.message);
    }

    await prisma.$disconnect();
}

// Run main function if file is executed directly
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