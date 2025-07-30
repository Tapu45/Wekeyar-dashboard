import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CHUNK_SIZE = 100; // Process records in smaller chunks

export interface ClearStoreResult {
  storeName: string;
  billsDeleted: number;
  billDetailsDeleted: number;
  customersDeleted: number;
}

export async function clearStoreDataByName(storeName: string): Promise<ClearStoreResult> {
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

    // 1. Delete bill details in chunks
    while (true) {
      // Get a chunk of billDetails IDs to delete
      const billDetailsToDelete = await prisma.billDetails.findMany({
        where: {
          bill: {
            storeId: store.id
          }
        },
        select: { id: true },
        take: CHUNK_SIZE
      });

      if (billDetailsToDelete.length === 0) break;

      const deleted = await prisma.billDetails.deleteMany({
        where: {
          id: { in: billDetailsToDelete.map(bd => bd.id) }
        }
      });

      totalBillDetailsDeleted += deleted.count;
    }

    // 2. Delete bills in chunks
    while (true) {
      const billsToDelete = await prisma.bill.findMany({
        where: { storeId: store.id },
        select: { id: true },
        take: CHUNK_SIZE
      });

      if (billsToDelete.length === 0) break;

      const deleted = await prisma.bill.deleteMany({
        where: {
          id: { in: billsToDelete.map(b => b.id) }
        }
      });

      totalBillsDeleted += deleted.count;
    }

    // 3. Find and delete unused customers
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
      // Delete customers in chunks
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

  } catch (error) {
    console.error(`Error clearing store "${storeName}" data:`, error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  try {
    const result = await clearStoreDataByName("RUCHIKA");
    console.log(result);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();