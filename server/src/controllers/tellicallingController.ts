import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { CustomRequest } from "../types/types";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

/**
 * Fetch all telecalling customers
 */
export const getTelecallingCustomers = async (_req: Request, res: Response) => {
    try {
      const customers = await prisma.telecallingCustomer.findMany({
        where: {
          // Fetch only customers marked as telecalling customers
          remarks: { not: null }, // Example: Fetch customers with remarks (admin-assigned)
        },
        include: {
          orders: true, // Include related orders
        },
      });
      res.status(200).json(customers);
    } catch (error) {
      console.error("Error fetching telecalling customers:", error);
      res.status(500).json({ error: "Failed to fetch telecalling customers" });
    }
  };

/**
 * Fetch all products
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    // Fetch products filtered by the search query
    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: search as string, // Partial match
          mode: "insensitive", // Case-insensitive search
        },
      },
      orderBy: {
        createdAt: "desc", // Order by creation date to identify new products
      },
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

/**
 * Save a telecalling order
 */

export const saveTelecallingOrder = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(403).json({ error: "Unauthorized. User not found." });
      return;
    }

    const { telecallingCustomerId, products, remarks } = req.body;

    // Check if the customer exists in the TelecallingCustomer table
    let telecallingCustomer = await prisma.telecallingCustomer.findFirst({
      where: { customerId: telecallingCustomerId },
    });

    // If the customer does not exist, add them to the TelecallingCustomer table
    if (!telecallingCustomer) {
      const inactiveCustomer = await prisma.customer.findUnique({
        where: { id: telecallingCustomerId },
      });

      if (!inactiveCustomer) {
        res.status(400).json({ error: "Invalid telecallingCustomerId. Customer does not exist." });
        return;
      }

      telecallingCustomer = await prisma.telecallingCustomer.create({
        data: {
          customerId: inactiveCustomer.id,
          customerName: inactiveCustomer.name,
          customerPhone: inactiveCustomer.phone,
          storeName: null, // Add storeName if available
          remarks: remarks || null,
        },
      });
    }

    // Get the telecallerId from the logged-in user
    const telecallerId = req.user.id;

    // Create the order
    const order = await prisma.telecallingOrder.create({
      data: {
        telecallingCustomerId: telecallingCustomer.id,
        telecallerId,
        orderDetails: {
          create: products.map((product: { productName: string; quantity: number; isNewProduct: boolean }) => ({
            productName: product.productName,
            quantity: product.quantity,
            isNewProduct: product.isNewProduct,
          })),
        },
      },
      include: {
        orderDetails: true,
      },
    });

    // Update remarks for the customer
    if (remarks) {
      await prisma.telecallingCustomer.update({
        where: { id: telecallingCustomer.id },
        data: { remarks },
      });
    }

    res.status(201).json(order);
  } catch (error) {
    console.error("Error saving telecalling order:", error);
    res.status(500).json({ error: "Failed to save telecalling order" });
  }
};

/**
 * Fetch all telecalling orders
 */
/**
 * Fetch all telecalling orders
 */
export const getTelecallingOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.telecallingOrder.findMany({
      include: {
        telecallingCustomer: true, // Include related customer details
        orderDetails: true, // Include product details for each order
      },
    });

    const result = orders.map((order) => ({
      id: order.id,
      orderDate: order.orderDate,
      telecallingCustomer: {
        id: order.telecallingCustomer.id,
        customerName: order.telecallingCustomer.customerName,
        customerPhone: order.telecallingCustomer.customerPhone,
      },
      orderDetails: order.orderDetails.map((detail) => ({
        productName: detail.productName,
        quantity: detail.quantity,
        isNewProduct: detail.isNewProduct,
      })),
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching telecalling orders:", error);
    res.status(500).json({ error: "Failed to fetch telecalling orders" });
  }
};

/**
 * Fetch all telecalling orders with telecaller details
 */
export const getAllTelecallingOrders = async (_req: Request, res: Response) => {
  try {
    const orders = await prisma.telecallingOrder.findMany({
      include: {
        telecallingCustomer: true, // Include customer details
        telecaller: true, // Include telecaller details
        orderDetails: true, // Include product details for each order
      },
      orderBy: {
        orderDate: "desc", // Order by the most recent orders
      },
    });

    const result = orders.map((order) => ({
      id: order.id,
      orderDate: order.orderDate,
      telecallingCustomer: {
        id: order.telecallingCustomer.id,
        customerName: order.telecallingCustomer.customerName,
        customerPhone: order.telecallingCustomer.customerPhone,
      },
      telecaller: {
        id: order.telecaller.id,
        username: order.telecaller.username,
        email: order.telecaller.email,
      },
      orderDetails: order.orderDetails.map((detail) => ({
        productName: detail.productName,
        quantity: detail.quantity,
        isNewProduct: detail.isNewProduct,
      })),
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching all telecalling orders:", error);
    res.status(500).json({ error: "Failed to fetch all telecalling orders" });
  }
};

/**
 * Fetch all new products
 */
export const getNewProducts = async (_req: Request, res: Response) => {
  try {
    const newProducts = await prisma.telecallingOrderDetails.findMany({
      where: {
        isNewProduct: true, // Only fetch products marked as new
      },
      include: {
        telecallingOrder: {
          include: {
            telecallingCustomer: true, // Include customer details
            telecaller: true, // Include telecaller details
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Order by the most recent products
      },
    });

    const result = newProducts.map((detail) => ({
      id: detail.id,
      productName: detail.productName,
      quantity: detail.quantity,
      orderDate: detail.telecallingOrder.orderDate,
      telecallingCustomer: {
        id: detail.telecallingOrder.telecallingCustomer.id,
        customerName: detail.telecallingOrder.telecallingCustomer.customerName,
        customerPhone: detail.telecallingOrder.telecallingCustomer.customerPhone,
      },
      telecaller: {
        id: detail.telecallingOrder.telecaller.id,
        username: detail.telecallingOrder.telecaller.username,
      },
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching new products:", error);
    res.status(500).json({ error: "Failed to fetch new products" });
  }
};

export const getTelecallersWithOrderCount = async (_req: Request, res: Response) => {
  try {
    const telecallers = await prisma.user.findMany({
      where: { role: "tellecaller" },
      select: {
        id: true,
        username: true,
        email: true,
        _count: {
          select: { telecallingOrders: true },
        },
      },
    });

    const result = telecallers.map(tc => ({
      id: tc.id,
      username: tc.username,
      email: tc.email,
      orderCount: tc._count.telecallingOrders,
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching telecallers with order count:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateCustomerRemarks = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params; // Customer ID (from the customerId column)
    const { remarks } = req.body;

    if (!remarks) {
      res.status(400).json({ error: "Remarks are required" });
      return;
    }

    // Check if the customer exists using the customerId column
    let customer = await prisma.telecallingCustomer.findFirst({
      where: { customerId: Number(id) }, // Match against customerId
    });

    if (!customer) {
      const inactiveCustomer = await prisma.customer.findUnique({
        where: { id: Number(id) },
      });

      if (!inactiveCustomer) {
        res.status(404).json({ error: "Customer not found in the main Customer table." });
        return;
      }
      customer = await prisma.telecallingCustomer.create({
        data: {
          customerId: inactiveCustomer.id,
          customerName: inactiveCustomer.name,
          customerPhone: inactiveCustomer.phone,
          storeName: null, // Add storeName if available
          remarks, // Save the remarks
        },
      });
    } else {
      // Update the remarks for the existing customer
      await prisma.telecallingCustomer.update({
        where: { id: customer.id },
        data: { remarks },
      });
    }

    // Get the telecallerId from the logged-in user
    const telecallerId = req.user?.id;

    if (!telecallerId) {
      res.status(403).json({ error: "Unauthorized. Telecaller ID not found." });
      return;
    }

    // Update the remarks for the customer
    await prisma.telecallingCustomer.update({
      where: { id: customer.id },
      data: { remarks },
    });

    // Insert a record into the TelecallerHandledCustomer table
    await prisma.telecallerHandledCustomer.create({
      data: {
        telecallerId,
        customerId: customer.id,
      },
    });

    res.status(200).json({ message: "Remarks updated and customer marked as handled." });
  } catch (error) {
    console.error("Error updating customer remarks:", error);
    res.status(500).json({ error: "Failed to update customer remarks" });
  }
};

export const getTelecallerRemarksOrders = async (req: CustomRequest, res: Response): Promise<void> => {
  try {
    // Get the telecallerId from the logged-in user
    const telecallerId = req.user?.id;

    if (!telecallerId) {
      res.status(403).json({ error: "Unauthorized. Telecaller ID not found." });
      return;
    }

    // Fetch all customers
    const customers = await prisma.telecallingCustomer.findMany({
      where: {
        remarks: { not: null }, // Example: Fetch customers with remarks
      },
      select: {
        id: true,
        customerName: true,
        customerPhone: true,
        remarks: true,
      },
    });

    // Fetch all orders related to the telecaller
    const orders = await prisma.telecallingOrder.findMany({
      where: {
        telecallerId, // Filter by the logged-in telecaller
      },
      select: {
        telecallingCustomerId: true,
        id: true,
      },
    });

    // Create a map of orders for quick lookup
    const orderMap = new Map<number, number[]>();
    orders.forEach((order) => {
      if (!orderMap.has(order.telecallingCustomerId)) {
        orderMap.set(order.telecallingCustomerId, []);
      }
      orderMap.get(order.telecallingCustomerId)?.push(order.id);
    });

    // Merge the customer data with the order data
    const result = customers.map((customer) => ({
      id: customer.id,
      customerName: customer.customerName,
      customerPhone: customer.customerPhone,
      remarks: customer.remarks || "No remarks",
      orderCount: orderMap.get(customer.id)?.length || 0, // Count the orders for the customer
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching telecaller remarks/orders:", error);
    res.status(500).json({ error: "Failed to fetch telecaller remarks/orders" });
  }
};
/**
 * Add a new telecalling customer
 */
export const addNewTelecallingCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { storeName, customerName, customerPhone } = req.body;

    // Validate input
    if (!storeName || !customerName || !customerPhone) {
     res.status(400).json({ error: "Store name, customer name, and phone number are required." });
      return;
    }

    // Check if the customer already exists
    const existingCustomer = await prisma.telecallingCustomer.findFirst({
      where: { customerPhone },
    });

    if (existingCustomer) {
     res.status(400).json({ error: "Customer with this phone number already exists." });
      return;
    }

    // Create a new customer
    const newCustomer = await prisma.telecallingCustomer.create({
      data: {
        customerId: parseInt(uuidv4().replace(/-/g, "").slice(0, 4), 16), // Generate a unique 10-digit number
        storeName,
        customerName,
        customerPhone,
      },
    });

    res.status(201).json(newCustomer);
  } catch (error) {
    console.error("Error adding new telecalling customer:", error);
    res.status(500).json({ error: "Failed to add new telecalling customer." });
  }
};

