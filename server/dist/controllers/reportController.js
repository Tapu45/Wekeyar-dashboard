"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvailableYears = exports.getMonthlyRevenue = exports.getYearlyRevenue = exports.getAllCustomers = exports.getStoreWiseSalesReport = exports.getCustomerReport = exports.getNonBuyingMonthlyCustomers = exports.getNonBuyingCustomers = exports.getSummary = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
exports.prisma = new client_1.PrismaClient();
const getSummary = async (_req, res) => {
    try {
        const totalCustomers = await exports.prisma.customer.count();
        const totalRevenueData = await exports.prisma.bill.aggregate({
            _sum: { netAmount: true },
        });
        const currentDate = new Date();
        const lastMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const lastMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        console.log("Last Month Start:", lastMonthStart);
        console.log("Last Month End:", lastMonthEnd);
        const activeCustomersList = await exports.prisma.customer.findMany({
            where: { bills: { some: { date: { gte: lastMonthStart, lte: lastMonthEnd } } } },
            select: {
                id: true,
                name: true,
                phone: true,
            },
        });
        console.log("Active Customers Count:", activeCustomersList.length);
        console.log("Active Customers Details:", activeCustomersList);
        const inactiveCustomers = totalCustomers - activeCustomersList.length;
        const avgMonthlyRevenue = totalRevenueData._sum.netAmount
            ? totalRevenueData._sum.netAmount / 12
            : 0;
        const summary = {
            totalCustomers,
            activeCustomers: activeCustomersList.length,
            inactiveCustomers,
            totalRevenue: totalRevenueData._sum.netAmount || 0,
            avgMonthlyRevenue,
        };
        res.json(summary);
    }
    catch (error) {
        console.error("Error in getSummary:", error);
        res.status(500).json({ error: "Internal server error", details: error });
    }
};
exports.getSummary = getSummary;
const getNonBuyingCustomers = async (req, res) => {
    try {
        const { region, storeId, customerType, days = 90 } = req.query;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - Number(days));
        const customers = await exports.prisma.customer.findMany({
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
        const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const customers = await exports.prisma.customer.findMany({
            where: {
                bills: {
                    none: { date: { gte: currentMonthStart } },
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
const getCustomerReport = async (req, res) => {
    try {
        const { startDate, endDate, storeId } = req.query;
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const whereCondition = {};
        if (start && end) {
            whereCondition.date = {
                gte: start,
                lte: end,
            };
        }
        if (storeId) {
            whereCondition.storeId = Number(storeId);
        }
        const bills = await exports.prisma.bill.findMany({
            where: whereCondition,
            include: {
                customer: true,
                store: true,
            },
        });
        const customerData = new Map();
        bills.forEach((bill) => {
            const { id, name, phone } = bill.customer;
            const storeName = bill.store.storeName;
            if (!customerData.has(id)) {
                customerData.set(id, {
                    customerName: name,
                    mobileNo: phone,
                    totalSales: 0,
                    purchaseFrequency: 0,
                    stores: new Map(),
                });
            }
            const customerEntry = customerData.get(id);
            customerEntry.totalSales += bill.netAmount;
            customerEntry.purchaseFrequency += 1;
            if (!customerEntry.stores.has(storeName)) {
                customerEntry.stores.set(storeName, 0);
            }
            customerEntry.stores.set(storeName, customerEntry.stores.get(storeName) + bill.netAmount);
        });
        const result = Array.from(customerData.values()).map((entry) => ({
            customerName: entry.customerName,
            mobileNo: entry.mobileNo,
            totalSales: entry.totalSales,
            purchaseFrequency: entry.purchaseFrequency,
            stores: Array.from(entry.stores.entries()).map(([storeName, sales]) => ({
                storeName,
                sales,
            })),
        }));
        res.json(result);
        return;
    }
    catch (error) {
        console.error("Error fetching customer report:", error);
        res.status(500).json({ error: "Internal server error" });
        return;
    }
};
exports.getCustomerReport = getCustomerReport;
const getStoreWiseSalesReport = async (req, res) => {
    try {
        const { date } = req.query;
        const selectedDate = date ? new Date(date) : new Date();
        const previousDay = (0, date_fns_1.subDays)(selectedDate, 1);
        const previousWeek = (0, date_fns_1.subWeeks)(selectedDate, 1);
        const previousMonth = (0, date_fns_1.subMonths)(selectedDate, 1);
        const stores = await exports.prisma.store.findMany();
        const fetchSalesData = async (storeId, targetDate) => {
            const sales = await exports.prisma.bill.findMany({
                where: {
                    storeId,
                    date: {
                        gte: new Date(targetDate.setHours(0, 0, 0, 0)),
                        lt: new Date(targetDate.setHours(23, 59, 59, 999)),
                    },
                },
                select: {
                    netAmount: true,
                    isUploaded: true,
                    billDetails: {
                        select: {
                            id: true,
                        },
                    },
                },
            });
            return {
                totalNetAmount: sales.reduce((sum, bill) => sum + bill.netAmount, 0),
                totalBills: sales.length,
                totalItemsSold: sales.reduce((sum, bill) => sum + bill.billDetails.length, 0),
                isUploaded: sales.length > 0 ? sales[0].isUploaded : false,
            };
        };
        const fetchLatestAvailableSales = async (storeId, referenceDate) => {
            const latestBill = await exports.prisma.bill.findFirst({
                where: {
                    storeId,
                    date: { lt: referenceDate },
                },
                orderBy: { date: "desc" },
                select: { date: true },
            });
            if (!latestBill) {
                return {
                    totalNetAmount: 0,
                    totalBills: 0,
                    totalItemsSold: 0,
                    referenceDate: null,
                };
            }
            return await fetchSalesData(storeId, latestBill.date);
        };
        const storeReports = await Promise.all(stores.map(async (store) => {
            const currentSales = await fetchSalesData(store.id, selectedDate);
            const previousDaySales = await fetchLatestAvailableSales(store.id, previousDay);
            const previousWeekSales = await fetchLatestAvailableSales(store.id, previousWeek);
            const previousMonthSales = await fetchLatestAvailableSales(store.id, previousMonth);
            return {
                storeName: store.storeName,
                address: store.address,
                salesData: {
                    totalNetAmount: currentSales.totalNetAmount,
                    totalBills: currentSales.totalBills,
                    totalItemsSold: currentSales.totalItemsSold,
                    isUploaded: currentSales.isUploaded,
                },
                trends: {
                    previousDay: previousDaySales,
                    previousWeek: previousWeekSales,
                    previousMonth: previousMonthSales,
                },
            };
        }));
        res.status(200).json({
            selectedDate: selectedDate.toISOString().split("T")[0],
            storeReports,
        });
    }
    catch (error) {
        console.error("Error fetching store-wise sales report:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getStoreWiseSalesReport = getStoreWiseSalesReport;
const getAllCustomers = async (_req, res) => {
    try {
        const currentDate = new Date();
        const lastMonthStart = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() - 1, 1));
        const lastMonthEnd = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 0, 23, 59, 59));
        console.log("Last Month Start (UTC):", lastMonthStart.toISOString());
        console.log("Last Month End (UTC):", lastMonthEnd.toISOString());
        const customers = await exports.prisma.customer.findMany({
            select: {
                name: true,
                phone: true,
                address: true,
                bills: {
                    select: { date: true },
                    orderBy: { date: "desc" },
                    take: 1,
                },
            },
        });
        console.log("Fetched Customers:", customers);
        const result = customers.map((customer) => {
            const lastPurchaseDate = customer.bills.length ? new Date(customer.bills[0].date) : null;
            console.log(`Customer: ${customer.name}, Last Purchase (Raw):`, customer.bills[0]?.date);
            console.log(`Customer: ${customer.name}, Last Purchase (Parsed):`, lastPurchaseDate?.toISOString());
            let isActive = false;
            if (lastPurchaseDate) {
                isActive =
                    lastPurchaseDate.getTime() >= lastMonthStart.getTime() &&
                        lastPurchaseDate.getTime() <= lastMonthEnd.getTime();
            }
            console.log(`Customer: ${customer.name}, Status: ${isActive ? "Active" : "Inactive"}`);
            return {
                name: customer.name,
                phone: customer.phone,
                address: customer.address,
                status: isActive ? "Active" : "Inactive",
            };
        });
        res.status(200).json(result);
    }
    catch (error) {
        console.error("Error fetching customers:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getAllCustomers = getAllCustomers;
const getYearlyRevenue = async (_req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 4;
        const years = Array.from({ length: 5 }, (_, i) => startYear + i);
        const yearlyRevenue = await Promise.all(years.map(async (year) => {
            const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
            const endDate = new Date(`${year}-12-31T23:59:59.999Z`);
            const revenue = await exports.prisma.bill.aggregate({
                _sum: {
                    netAmount: true,
                },
                where: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
            });
            return {
                year,
                revenue: revenue._sum.netAmount || 0,
            };
        }));
        res.status(200).json(yearlyRevenue);
    }
    catch (error) {
        console.error("Error fetching yearly revenue:", error);
        res.status(500).json({ error: "Failed to fetch yearly revenue data" });
    }
};
exports.getYearlyRevenue = getYearlyRevenue;
const getMonthlyRevenue = async (req, res) => {
    try {
        const { year } = req.params;
        const selectedYear = parseInt(year) || new Date().getFullYear();
        const months = Array.from({ length: 12 }, (_, i) => i + 1);
        const monthlyRevenue = await Promise.all(months.map(async (month) => {
            const startDate = new Date(`${selectedYear}-${month.toString().padStart(2, '0')}-01T00:00:00.000Z`);
            const lastDay = new Date(selectedYear, month, 0).getDate();
            const endDate = new Date(`${selectedYear}-${month.toString().padStart(2, '0')}-${lastDay}T23:59:59.999Z`);
            const revenue = await exports.prisma.bill.aggregate({
                _sum: {
                    netAmount: true
                },
                where: {
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });
            return {
                month,
                monthName: new Date(selectedYear, month - 1, 1).toLocaleString('default', { month: 'short' }),
                revenue: revenue._sum.netAmount || 0
            };
        }));
        res.status(200).json(monthlyRevenue);
    }
    catch (error) {
        console.error('Error fetching monthly revenue:', error);
        res.status(500).json({ error: 'Failed to fetch monthly revenue data' });
    }
};
exports.getMonthlyRevenue = getMonthlyRevenue;
const getAvailableYears = async (_req, res) => {
    try {
        const earliestBill = await exports.prisma.bill.findFirst({
            orderBy: {
                date: 'asc',
            },
            select: {
                date: true,
            },
        });
        const latestBill = await exports.prisma.bill.findFirst({
            orderBy: {
                date: 'desc',
            },
            select: {
                date: true,
            },
        });
        const currentYear = new Date().getFullYear();
        const earliestYear = earliestBill ? earliestBill.date.getFullYear() : currentYear;
        const latestYear = latestBill ? latestBill.date.getFullYear() : currentYear;
        const years = Array.from({ length: latestYear - earliestYear + 1 }, (_, i) => earliestYear + i);
        res.status(200).json(years);
    }
    catch (error) {
        console.error('Error fetching available years:', error);
        res.status(500).json({ error: 'Failed to fetch available years' });
    }
};
exports.getAvailableYears = getAvailableYears;
//# sourceMappingURL=reportController.js.map