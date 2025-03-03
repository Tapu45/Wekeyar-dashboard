import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding data...');

  // Create 100 Stores
  const stores = await Promise.all(
    Array.from({ length: 100 }).map(() =>
      prisma.store.create({
        data: {
          name: faker.company.name(),
          address: faker.location.streetAddress(),
          phone: faker.phone.number(),
          email: faker.internet.email(),
        },
      })
    )
  );

  console.log('✅ 100 Stores created');

  // Create 500 Customers
  const customers = await Promise.all(
    Array.from({ length: 100 }).map(() =>
      prisma.customer.create({
        data: {
          name: faker.person.fullName(),
          mobileNo: faker.phone.number(),
          email: faker.internet.email(),
          address: faker.location.streetAddress(),
        },
      })
    )
  );

  console.log('✅ 100 Customers created');

  // Create 100 Transactions
  const transactions = await Promise.all(
    Array.from({ length: 50 }).map(() => {
      const store = stores[Math.floor(Math.random() * stores.length)];
      const customer = customers[Math.floor(Math.random() * customers.length)];

      return prisma.transaction.create({
        data: {
          date: faker.date.past(),
          storeId: store.id,
          customerId: customer.id,
        },
      });
    })
  );

  console.log('✅ 50 Transactions created');

  // Create 5000 Products
  await Promise.all(
    transactions.map(async (transaction) => {
      const productsToCreate = Array.from({ length: 5 }).map(() => ({
        name: faker.commerce.productName(),
        quantity: faker.number.int({ min: 1, max: 100 }),
        amount: parseFloat(faker.commerce.price({ min: 10, max: 500 })),
        transactionId: transaction.id,
      }));

      return prisma.product.createMany({
        data: productsToCreate,
      });
    })
  );

  console.log('✅  Products created');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
