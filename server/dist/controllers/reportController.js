"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNonBuyingMonthlyCustomers = exports.getNonBuyingCustomers = exports.getSummary = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getSummary = async (_req, res) => {
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
        const summary = {
            totalCustomers,
            activeCustomers,
            inactiveCustomers,
            totalRevenue: totalRevenueData._sum.netAmount || 0,
            avgMonthlyRevenue,
        };
        res.json(summary);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error", details: error });
    }
};
exports.getSummary = getSummary;
const getNonBuyingCustomers = async (req, res) => {
    try {
        const { region, storeId, customerType, days = 90 } = req.query;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - Number(days));
        const customers = await prisma.customer.findMany({
            where: {
                bills: { none: { date: { gte: cutoffDate } } },
                ...(storeId ? { bills: { some: { storeId: Number(storeId) } } } : {}),
                ...(region ? { address: { contains: region } } : {}),
                ...(customerType ? { customerType: customerType } : {}),
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
        const result = customers.map((customer) => ({
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            lastPurchaseDate: customer.bills.length ? customer.bills[0].date : null,
            totalPurchaseValue: customer.bills.reduce((acc, bill) => acc + bill.netAmount, 0),
        }));
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error", details: error });
    }
};
exports.getNonBuyingCustomers = getNonBuyingCustomers;
const getNonBuyingMonthlyCustomers = async (_req, res) => {
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
        const result = customers.map((customer) => {
            const totalAmount = customer.bills.reduce((acc, bill) => acc + bill.netAmount, 0);
            const monthsCount = new Set(customer.bills.map((bill) => `${bill.date.getFullYear()}-${bill.date.getMonth()}`)).size;
            return {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                monthlyAvgPurchase: monthsCount ? totalAmount / monthsCount : 0,
                lastPurchaseDate: customer.bills.length ? customer.bills[0].date : null,
            };
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error", details: error });
    }
};
exports.getNonBuyingMonthlyCustomers = getNonBuyingMonthlyCustomers;
//# sourceMappingURL=reportController.js.map