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
