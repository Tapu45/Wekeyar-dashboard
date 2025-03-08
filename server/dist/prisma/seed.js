"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const faker_1 = require("@faker-js/faker");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🚀 Seeding data...');
    const stores = await Promise.all(Array.from({ length: 100 }).map(() => prisma.store.create({
        data: {
            name: faker_1.faker.company.name(),
            address: faker_1.faker.location.streetAddress(),
            phone: faker_1.faker.phone.number(),
            email: faker_1.faker.internet.email(),
        },
    })));
    console.log('✅ 100 Stores created');
    const customers = await Promise.all(Array.from({ length: 100 }).map(() => prisma.customer.create({
        data: {
            name: faker_1.faker.person.fullName(),
            mobileNo: faker_1.faker.phone.number(),
            email: faker_1.faker.internet.email(),
            address: faker_1.faker.location.streetAddress(),
        },
    })));
    console.log('✅ 100 Customers created');
    const transactions = await Promise.all(Array.from({ length: 50 }).map(() => {
        const store = stores[Math.floor(Math.random() * stores.length)];
        const customer = customers[Math.floor(Math.random() * customers.length)];
        return prisma.transaction.create({
            data: {
                date: faker_1.faker.date.past(),
                storeId: store.id,
                customerId: customer.id,
            },
        });
    }));
    console.log('✅ 50 Transactions created');
    await Promise.all(transactions.map(async (transaction) => {
        const productsToCreate = Array.from({ length: 5 }).map(() => ({
            name: faker_1.faker.commerce.productName(),
            quantity: faker_1.faker.number.int({ min: 1, max: 100 }),
            amount: parseFloat(faker_1.faker.commerce.price({ min: 10, max: 500 })),
            transactionId: transaction.id,
        }));
        return prisma.product.createMany({
            data: productsToCreate,
        });
    }));
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
//# sourceMappingURL=seed.js.map