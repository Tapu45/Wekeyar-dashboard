"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function clearDatabase() {
    try {
        console.log('Clearing database...');
        await prisma.product.deleteMany();
        console.log('Resetting auto-increment IDs...');
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Product_id_seq" RESTART WITH 1`);
        console.log('Database cleared and auto-increment IDs reset successfully.');
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