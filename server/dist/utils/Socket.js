"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const setupSocketIO = (io) => {
    io.on("connection", async (socket) => {
        console.log("A user connected:", socket.id);
        const telecallingCustomers = await prisma.telecallingCustomer.findMany({
            select: {
                customerId: true,
                customerName: true,
                customerPhone: true,
                lastPurchaseDate: true,
                storeName: true,
            },
        });
        socket.emit("updateTelecalling", telecallingCustomers);
        socket.on("disconnect", () => {
            console.log("A user disconnected:", socket.id);
        });
        socket.on("copyToTelecalling", async (customers) => {
            console.log("Customers copied to telecalling:", customers);
            for (const customer of customers) {
                await prisma.telecallingCustomer.upsert({
                    where: { customerId: customer.id },
                    update: { status: "sent" },
                    create: {
                        customerId: customer.id,
                        customerName: customer.name,
                        customerPhone: customer.phone,
                        lastPurchaseDate: customer.lastPurchaseDate
                            ? new Date(customer.lastPurchaseDate)
                            : null,
                        storeName: customer.storeName || "N/A",
                        status: "sent",
                    },
                });
            }
            const updatedCustomers = await prisma.telecallingCustomer.findMany({
                select: {
                    customerId: true,
                    customerName: true,
                    customerPhone: true,
                    lastPurchaseDate: true,
                    storeName: true,
                    status: true,
                },
            });
            io.emit("updateTelecalling", updatedCustomers);
        });
        socket.on("getTelecallingCustomers", async () => {
            console.log("Fetching current telecalling customers...");
            try {
                const handledCustomerIds = await prisma.telecallerHandledCustomer.findMany({
                    select: { customerId: true },
                }).then((handledCustomers) => handledCustomers.map((hc) => hc.customerId));
                const telecallingCustomers = await prisma.telecallingCustomer.findMany({
                    where: {
                        NOT: {
                            id: {
                                in: handledCustomerIds,
                            },
                        },
                    },
                    select: {
                        customerId: true,
                        customerName: true,
                        customerPhone: true,
                        lastPurchaseDate: true,
                        storeName: true,
                    },
                });
                console.log("Filtered Telecalling Customers:", telecallingCustomers);
                socket.emit("updateTelecalling", telecallingCustomers);
            }
            catch (error) {
                console.error("Error fetching telecalling customers:", error);
                socket.emit("error", { message: "Failed to fetch telecalling customers" });
            }
        });
    });
};
exports.default = setupSocketIO;
//# sourceMappingURL=Socket.js.map