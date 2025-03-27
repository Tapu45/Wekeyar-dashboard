"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function clearDatabase() {
    try {
        console.log('Clearing database...');
        await prisma.billDetails.deleteMany();
        await prisma.bill.deleteMany();
        await prisma.telecallingOrderDetails.deleteMany();
        await prisma.telecallingOrder.deleteMany();
        await prisma.telecallerHandledCustomer.deleteMany();
        await prisma.telecallingCustomer.deleteMany();
        await prisma.uploadHistory.deleteMany();
        await prisma.customer.deleteMany();
        await prisma.store.deleteMany();
        await prisma.product.deleteMany();
        await prisma.user.deleteMany();
        console.log('Database cleared successfully.');
    }
    catch (error) {
        console.error('Error clearing database:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
clearDatabase();
//# sourceMappingURL=ClearDatabase.js.map