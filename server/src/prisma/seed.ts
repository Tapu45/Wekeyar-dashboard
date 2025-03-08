import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const generateStores = async (count: number) => {
  const stores = [];
  for (let i = 0; i < count; i++) {
    stores.push({
      id: faker.string.uuid(),
      name: faker.company.name(),
      location: faker.location.city(),
    });
  }
  return stores;
};

const generateDailySales = async (storeIds: string[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return storeIds.map((storeId) => ({
    id: faker.string.uuid(),
    storeId,
    date: today,
    uploaded: faker.datatype.boolean(), // Random Yes/No for uploaded
    lastUpdated: faker.date.recent({ days: 3 }), // Random last update within last 3 days
    totalSales: parseFloat(faker.finance.amount({ min: 100, max: 1000 })), // Random total sales between 100 and 1000
    totalQuantity: faker.number.int({ min: 1, max: 100 }), // Random total quantity between 1 and 100
  }));
};

const seedDatabase = async () => {
  try {
    console.log("Seeding database...");

    // Create Fake Stores
    const storeData = await generateStores(10);
    await prisma.store.createMany({ data: storeData });

    // Get store IDs
    const stores = await prisma.store.findMany();
    const storeIds = stores.map((store) => store.id);

    // Create Fake Daily Sales Data
    const salesData = await generateDailySales(storeIds);
    await prisma.dailySales.createMany({ data: salesData });

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await prisma.$disconnect();
  }
};

seedDatabase();
