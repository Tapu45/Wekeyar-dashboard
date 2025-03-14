"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const faker_1 = require("@faker-js/faker");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Seeding database...");
    const stores = await prisma.store.createMany({
        data: Array.from({ length: 5 }).map(() => ({
            storeName: faker_1.faker.company.name(),
            address: faker_1.faker.location.streetAddress(),
        })),
    });
    const storeIds = await prisma.store.findMany({ select: { id: true } });
    const customers = await prisma.customer.createMany({
        data: Array.from({ length: 20 }).map(() => ({
            name: faker_1.faker.person.fullName(),
            phone: faker_1.faker.phone.number(),
            address: faker_1.faker.location.streetAddress(),
        })),
    });
    const customerIds = await prisma.customer.findMany({ select: { id: true } });
    for (let i = 0; i < 50; i++) {
        const customer = faker_1.faker.helpers.arrayElement(customerIds);
        const store = faker_1.faker.helpers.arrayElement(storeIds);
        const bill = await prisma.bill.create({
            data: {
                billNo: faker_1.faker.string.uuid(),
                customerId: customer.id,
                storeId: store.id,
                date: faker_1.faker.date.past(),
                netDiscount: faker_1.faker.number.float({ min: 5, max: 50 }),
                netAmount: faker_1.faker.number.float({ min: 100, max: 5000 }),
                isUploaded: faker_1.faker.datatype.boolean(),
            },
        });
        await prisma.billDetails.createMany({
            data: Array.from({ length: faker_1.faker.number.int({ min: 1, max: 5 }) }).map(() => ({
                billId: bill.id,
                item: faker_1.faker.commerce.productName(),
                quantity: faker_1.faker.number.int({ min: 1, max: 10 }),
                batch: faker_1.faker.string.alphanumeric(8),
                mrp: faker_1.faker.number.float({ min: 10, max: 1000 }),
                discount: faker_1.faker.number.float({ min: 1, max: 20 }),
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
//# sourceMappingURL=seed.js.map