import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface Customer {
  id: number;
  name: string;
  phone: string;
  lastPurchaseDate: string | null;
  storeName: string | null; // Add storeName
}

const setupSocketIO = (io: Server) => {
  io.on("connection", async (socket) => {
    console.log("A user connected:", socket.id);

    // Fetch the current telecalling customers from the database
    const telecallingCustomers = await prisma.telecallingCustomer.findMany({
      select: {
        customerId: true,
        customerName: true,
        customerPhone: true,
        lastPurchaseDate: true,
        storeName: true, // Include store name
      },
    });
    socket.emit("updateTelecalling", telecallingCustomers);

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    });

    // Handle "copyToTelecalling" event
    socket.on("copyToTelecalling", async (customers: Customer[]) => {
      console.log("Customers copied to telecalling:", customers);

      // Insert new customers into the database without overriding existing data
      for (const customer of customers) {
        await prisma.telecallingCustomer.upsert({
          where: { customerId: customer.id },
          update: { status: "sent" }, // Update status to "sent"
          create: {
            customerId: customer.id,
            customerName: customer.name,
            customerPhone: customer.phone,
            lastPurchaseDate: customer.lastPurchaseDate
              ? new Date(customer.lastPurchaseDate)
              : null,
            storeName: customer.storeName || "N/A",
            status: "sent", // Set status to "sent" for new customers
          },
        });
      }

      // Fetch the updated list of telecalling customers
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

      // Broadcast the updated customers to all connected clients
      io.emit("updateTelecalling", updatedCustomers);
    });

    // Handle "getTelecallingCustomers" event
    socket.on("getTelecallingCustomers", async () => {
      console.log("Fetching current telecalling customers...");
    
      try {
        // Step 1: Fetch the list of handled customer IDs
        const handledCustomerIds = await prisma.telecallerHandledCustomer.findMany({
          select: { customerId: true },
        }).then((handledCustomers) => handledCustomers.map((hc) => hc.customerId));
    
        // Step 2: Fetch customers who are not in the handledCustomerIds list
        const telecallingCustomers = await prisma.telecallingCustomer.findMany({
          where: {
            NOT: {
              id: {
                in: handledCustomerIds, // Use the resolved array here
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
    
        // Emit the filtered customer list to the client
        socket.emit("updateTelecalling", telecallingCustomers);
      } catch (error) {
        console.error("Error fetching telecalling customers:", error);
        socket.emit("error", { message: "Failed to fetch telecalling customers" });
      }
    });
  });
};

export default setupSocketIO;