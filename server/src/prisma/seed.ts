import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Generate Stores
  const stores = await prisma.store.createMany({
    data: Array.from({ length: 5 }).map(() => ({
      storeName: faker.company.name(),
      address: faker.location.streetAddress(),
    })),
  });

  // Fetch store IDs
  const storeIds = await prisma.store.findMany({ select: { id: true } });

  // Generate Customers
  const customers = await prisma.customer.createMany({
    data: Array.from({ length: 20 }).map(() => ({
      name: faker.person.fullName(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
    })),
  });

  // Fetch customer IDs
  const customerIds = await prisma.customer.findMany({ select: { id: true } });

  // Generate Bills
  for (let i = 0; i < 50; i++) {
    const customer = faker.helpers.arrayElement(customerIds);
    const store = faker.helpers.arrayElement(storeIds);

    const bill = await prisma.bill.create({
      data: {
        billNo: faker.string.uuid(),
        customerId: customer.id,
        storeId: store.id,
        date: faker.date.past(),
        netDiscount: faker.number.float({ min: 5, max: 50 }),
        netAmount: faker.number.float({ min: 100, max: 5000 }),
        isUploaded: faker.datatype.boolean(),
      },
    });

    // Generate Bill Details
    await prisma.billDetails.createMany({
      data: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }).map(() => ({
        billId: bill.id,
        item: faker.commerce.productName(),
        quantity: faker.number.int({ min: 1, max: 10 }),
        batch: faker.string.alphanumeric(8),
        mrp: faker.number.float({ min: 10, max: 1000 }),
        discount: faker.number.float({ min: 1, max: 20 }),
      })),
    });
  }

  console.log("Seeding completed.", { stores, customers });
}

main()
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
