import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { SummaryReport, NonBuyingCustomer, MonthlyNonBuyingCustomer } from "src/types/types";

const prisma = new PrismaClient();

/**
 * 1. Summary Report
 */
export const getSummary = async (_req: Request, res: Response) => {
  try {
    const totalCustomers = await prisma.customer.count();
    const totalRevenueData = await prisma.bill.aggregate({
      _sum: { netAmount: true },
    });

    const currentDate = new Date();
    const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    const activeCustomers = await prisma.customer.count({
      where: { bills: { some: { date: { gte: lastMonthStart, lte: lastMonthEnd } } } },
    });

    const inactiveCustomers = totalCustomers - activeCustomers;
    const avgMonthlyRevenue = totalRevenueData._sum.netAmount
      ? totalRevenueData._sum.netAmount / 12
      : 0;

    const summary: SummaryReport = {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      totalRevenue: totalRevenueData._sum.netAmount || 0,
      avgMonthlyRevenue,
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: "Internal server error", details: error });
  }
};

/**
 * 2. Non-Buying Customer Report (Default 90 Days)
 */
export const getNonBuyingCustomers = async (req: Request, res: Response) => {
  try {
    const { region, storeId, customerType, days = 90 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(days));

    const customers = await prisma.customer.findMany({
      where: {
        bills: { none: { date: { gte: cutoffDate } } },
        ...(storeId ? { bills: { some: { storeId: Number(storeId) } } } : {}),
        ...(region ? { address: { contains: region as string } } : {}),
        ...(customerType ? { customerType: customerType as string } : {}),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        bills: {
          select: {
            date: true,
            netAmount: true,
          },
          orderBy: { date: "desc" },
          take: 1,
        },
      },
    });

    const result: NonBuyingCustomer[] = customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      lastPurchaseDate: customer.bills.length ? customer.bills[0].date : null,
      totalPurchaseValue: customer.bills.reduce((acc, bill) => acc + bill.netAmount, 0),
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error", details: error });
  }
};

/**
 * 3. Non-Buying Customer List (Monthly Buyers)
 */
export const getNonBuyingMonthlyCustomers = async (_req: Request, res: Response) => {
  try {
    const currentDate = new Date();
    const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    const customers = await prisma.customer.findMany({
      where: {
        bills: {
          some: { date: { lt: lastMonthStart } },
          none: { date: { gte: lastMonthStart, lte: lastMonthEnd } },
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        bills: {
          select: { date: true, netAmount: true },
          orderBy: { date: "desc" },
        },
      },
    });

    const result: MonthlyNonBuyingCustomer[] = customers.map((customer) => {
      const totalAmount = customer.bills.reduce((acc, bill) => acc + bill.netAmount, 0);
      const monthsCount = new Set(
        customer.bills.map((bill) => `${bill.date.getFullYear()}-${bill.date.getMonth()}`)
      ).size;

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        monthlyAvgPurchase: monthsCount ? totalAmount / monthsCount : 0,
        lastPurchaseDate: customer.bills.length ? customer.bills[0].date : null,
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error", details: error });
  }
};

/**
 * 4. Customer Purchase History
 */
export const getCustomerReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, storeId } = req.query;

    // Convert query params to proper types
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const whereCondition: any = {};

    if (start && end) {
      whereCondition.date = {
        gte: start,
        lte: end, 
      };
    }

    if (storeId) {
      whereCondition.storeId = Number(storeId);
    }

    // Fetch all relevant bills
    const bills = await prisma.bill.findMany({
      where: whereCondition,
      include: {
        customer: true,
        store: true,
      },
    });

    // Group by customer
    const customerData = new Map();

    bills.forEach((bill) => {
      const { id, name, phone } = bill.customer;
      const storeName = bill.store.storeName;

      if (!customerData.has(id)) {
        customerData.set(id, {
          customerName: name,
          mobileNo: phone,
          totalSales: 0,
          purchaseFrequency: 0, // Fix: Count each bill separately
          stores: new Map(),
        });
      }

      const customerEntry = customerData.get(id);

      // Update total sales
      customerEntry.totalSales += bill.netAmount;

      // Fix: Increment purchase frequency per bill, not per store
      customerEntry.purchaseFrequency += 1;

      // Track sales per store
      if (!customerEntry.stores.has(storeName)) {
        customerEntry.stores.set(storeName, 0);
      }
      customerEntry.stores.set(storeName, customerEntry.stores.get(storeName) + bill.netAmount);
    });

    // Convert Map to JSON-friendly format
    const result = Array.from(customerData.values()).map((entry) => ({
      customerName: entry.customerName,
      mobileNo: entry.mobileNo,
      totalSales: entry.totalSales,
      purchaseFrequency: entry.purchaseFrequency, // Fix: Now counts every bill correctly
      stores: Array.from(entry.stores.entries() as [string, number][]).map(([storeName, sales]) => ({
        storeName,
        sales,
      })),
    }));

   res.json(result);
   return;
  } catch (error) {
    console.error("Error fetching customer report:", error);
   res.status(500).json({ error: "Internal server error" });
    return;
  }
};




