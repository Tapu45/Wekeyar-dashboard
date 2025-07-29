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
        console.log('Resetting auto-increment IDs...');
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE "BillDetails_id_seq" RESTART WITH 1`);
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Bill_id_seq" RESTART WITH 1`);
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE "TelecallingOrderDetails_id_seq" RESTART WITH 1`);
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE "TelecallingOrder_id_seq" RESTART WITH 1`);
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE "TelecallerHandledCustomer_id_seq" RESTART WITH 1`);
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE "TelecallingCustomer_id_seq" RESTART WITH 1`);
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE "UploadHistory_id_seq" RESTART WITH 1`);
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Customer_id_seq" RESTART WITH 1`);
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Store_id_seq" RESTART WITH 1`);
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Product_id_seq" RESTART WITH 1`);
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE "User_id_seq" RESTART WITH 1`);
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