import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteBillByNumber(billNumber: string) {
    try {
        console.log(`Looking for bill with number: ${billNumber}`);

        // 1. Find the bill by its number
        const bill = await prisma.bill.findFirst({
            where: {
                billNo: billNumber
            },
            include: {
                billDetails: true,
                store: true
            }
        });

        if (!bill) {
            console.error(`❌ Bill not found: ${billNumber}`);
            return;
        }

        console.log(`✅ Found bill: ${billNumber}`);
        console.log(`  - Store: ${bill.store.storeName}`);
        console.log(`  - Bill ID: ${bill.id}`);
        console.log(`  - Items count: ${bill.billDetails.length}`);

        // 2. Delete the bill details first (to maintain referential integrity)
        await prisma.billDetails.deleteMany({
            where: {
                billId: bill.id
            }
        });
        console.log(`✅ Deleted ${bill.billDetails.length} bill detail items`);

        // 3. Delete the bill itself
        await prisma.bill.delete({
            where: {
                id: bill.id
            }
        });

        console.log(`✅ Successfully deleted bill: ${billNumber}`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`❌ Error deleting bill: ${error.message}`);
        } else {
            console.error('❌ Unknown error occurred');
        }
    } finally {
        await prisma.$disconnect();
    }
}

// Get the bill number from command line arguments
const billNumber = process.argv[2];

if (!billNumber) {
    console.error('❌ Please provide a bill number as an argument');
    console.log('Usage: node seed3.js <bill-number>');
    process.exit(1);
}

// Execute the function with the provided bill number
deleteBillByNumber(billNumber);