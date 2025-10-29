import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Starting database cleanup...\n");

    // Count BillDetails before deletion
    const billDetailsCount = await prisma.billDetails.count();
    console.log(`📊 Found ${billDetailsCount} bill details`);
    const billDetailsDeleted = await prisma.billDetails.deleteMany({});
    console.log(`✓ Deleted ${billDetailsDeleted.count} bill details\n`);

    // Count Bills before deletion
    const billsCount = await prisma.bill.count();
    console.log(`📊 Found ${billsCount} bills`);
    const billsDeleted = await prisma.bill.deleteMany({});
    console.log(`✓ Deleted ${billsDeleted.count} bills\n`);

    // Count Customers before deletion
    const customersCount = await prisma.customer.count();
    console.log(`📊 Found ${customersCount} customers`);
    const customersDeleted = await prisma.customer.deleteMany({});
    console.log(`✓ Deleted ${customersDeleted.count} customers\n`);

    // Verify Stores are preserved
    const storesCount = await prisma.store.count();
    console.log(`📊 Verified ${storesCount} stores preserved\n`);

    console.log("═══════════════════════════════════════");
    console.log("✓ Database cleanup completed successfully!");
    console.log("═══════════════════════════════════════");
  } catch (error) {
    console.error("Error during database cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});