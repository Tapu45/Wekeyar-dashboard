"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStores = exports.getUploadStatusByMonth = exports.getBillDetailsByBillNo = exports.getCustomerPurchaseHistory = exports.getInactiveCustomers = exports.getAllCustomers = exports.getStoreWiseSalesReport = exports.getCustomerReport = exports.getNonBuyingMonthlyCustomers = exports.getNonBuyingCustomers = exports.getSummary = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
exports.prisma = new client_1.PrismaClient();
const getSummary = async (req, res) => {
    try {
        const { fromDate, toDate, storeId } = req.query;
        const today = new Date();
        const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
        const startDate = fromDate ? new Date(fromDate) : previousMonthStart;
        const endDate = toDate ? new Date(toDate) : previousMonthEnd;
        const totalCustomers = await exports.prisma.customer.count({
            where: storeId ? { bills: { some: { storeId: Number(storeId) } } } : undefined,
        });
        const inactiveCustomers = await exports.prisma.customer.findMany({
            where: {
                bills: {
                    none: {
                        date: {
                            gte: startDate,
                            lte: endDate,
                        },
                        ...(storeId ? { storeId: Number(storeId) } : {}),
                    },
                },
            },
            select: {
                id: true,
                bills: {
                    select: { date: true },
                    orderBy: { date: "desc" },
                    take: 1,
                },
            },
        });
        const filteredInactiveCustomers = inactiveCustomers.filter((customer) => {
            const lastPurchaseDate = customer.bills.length
                ? new Date(customer.bills[0].date)
                : null;
            return !lastPurchaseDate || lastPurchaseDate <= endDate;
        });
        const inactiveCustomerCount = filteredInactiveCustomers.length;
        const activeCustomerCount = totalCustomers - inactiveCustomerCount;
        const totalBills = await exports.prisma.bill.count({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
                ...(storeId ? { storeId: Number(storeId) } : {}),
            },
        });
        const bills = await exports.prisma.bill.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate,
                },
                ...(storeId ? { storeId: Number(storeId) } : {}),
            },
            select: {
                amountPaid: true,
                creditAmount: true,
            },
        });
        const totalAmount = bills.reduce((sum, bill) => sum + (bill.amountPaid - bill.creditAmount), 0);
        const summary = {
            totalCustomers,
            activeCustomers: activeCustomerCount,
            inactiveCustomers: inactiveCustomerCount,
            totalBills,
            totalAmount,
        };
        res.json(summary);
    }
    catch (error) {
        console.error("Error in getSummary:", error);
        res.status(500).json({ error: "Internal server error" });
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
        const { startDate, endDate, storeId, search, billNo } = req.query;
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const whereCondition = {};
        if (start && end) {
            whereCondition.date = {
                gte: start,
                lte: end,
            };
        }
        if (storeId && Number(storeId) !== 0) {
            whereCondition.storeId = Number(storeId);
        }
        if (billNo) {
            whereCondition.billNo = billNo;
        }
        if (search) {
            whereCondition.OR = [
                {
                    customer: {
                        name: { contains: search, mode: "insensitive" },
                    },
                },
                {
                    customer: {
                        phone: { contains: search, mode: "insensitive" },
                    },
                },
            ];
        }
        const bills = await exports.prisma.bill.findMany({
            where: whereCondition,
            include: {
                customer: true,
                billDetails: true,
            },
            orderBy: {
                date: "desc",
            },
        });
        const customerData = new Map();
        bills.forEach((bill) => {
            const { id, name, phone } = bill.customer;
            if (!customerData.has(id)) {
                customerData.set(id, {
                    customerId: id,
                    customerName: name,
                    mobileNo: phone,
                    totalBills: 0,
                    totalAmount: 0,
                    dates: new Map(),
                });
            }
            const customerEntry = customerData.get(id);
            customerEntry.totalBills += 1;
            customerEntry.totalAmount += bill.amountPaid - bill.creditAmount;
            const dateKey = bill.date.toISOString().split("T")[0];
            if (!customerEntry.dates.has(dateKey)) {
                customerEntry.dates.set(dateKey, {
                    date: dateKey,
                    totalAmount: 0,
                    salesBills: [],
                    returnBills: [],
                });
            }
            const dateEntry = customerEntry.dates.get(dateKey);
            dateEntry.totalAmount += bill.amountPaid - bill.creditAmount;
            if (!bill.billNo.startsWith("CN")) {
                dateEntry.salesBills.push({
                    billNo: bill.billNo,
                    amount: bill.amountPaid - bill.creditAmount,
                    medicines: bill.billDetails.map((detail) => ({
                        name: detail.item,
                        quantity: detail.quantity,
                    })),
                });
            }
            else {
                dateEntry.returnBills.push({
                    billNo: bill.billNo,
                    amount: bill.amountPaid + bill.creditAmount,
                    medicines: bill.billDetails.map((detail) => ({
                        name: detail.item,
                        quantity: detail.quantity,
                    })),
                });
            }
        });
        const result = Array.from(customerData.values()).map((customer) => ({
            ...customer,
            dates: Array.from(customer.dates.values()),
        }));
        res.json(result);
    }
    catch (error) {
        console.error("Error fetching customer report:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getCustomerReport = getCustomerReport;
const getStoreWiseSalesReport = async (req, res) => {
    try {
        const { date, searchQuery } = req.query;
        const selectedDate = date ? new Date(date) : new Date();
        const previousDay = (0, date_fns_1.subDays)(selectedDate, 1);
        const previousWeek = (0, date_fns_1.subWeeks)(selectedDate, 1);
        const previousMonth = (0, date_fns_1.subMonths)(selectedDate, 1);
        const currentMonthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const currentMonthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);
        const stores = await exports.prisma.store.findMany({
            where: {
                OR: searchQuery
                    ? [
                        { storeName: { contains: searchQuery, mode: "insensitive" } },
                        { address: { contains: searchQuery, mode: "insensitive" } },
                    ]
                    : undefined,
            },
        });
        const fetchSalesDataForRange = async (storeId, startDate, endDate) => {
            const sales = await exports.prisma.bill.findMany({
                where: {
                    storeId,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                select: {
                    amountPaid: true,
                    creditAmount: true,
                    createdAt: true,
                    billDetails: {
                        select: {
                            id: true,
                        },
                    },
                },
            });
            const totalNetAmount = sales.reduce((sum, bill) => sum + (bill.amountPaid - bill.creditAmount), 0);
            const lastUploadDate = sales.length > 0
                ? sales.reduce((latest, bill) => (bill.createdAt > latest ? bill.createdAt : latest), sales[0].createdAt)
                : null;
            return {
                totalNetAmount,
                totalBills: sales.length,
                totalItemsSold: sales.reduce((sum, bill) => sum + bill.billDetails.length, 0),
                isUploaded: sales.length > 0 ? true : false,
                lastUploadDate: lastUploadDate ? lastUploadDate.toISOString() : null,
            };
        };
        const storeReports = await Promise.all(stores.map(async (store) => {
            const currentSales = await fetchSalesDataForRange(store.id, selectedDate, selectedDate);
            const previousDaySales = await fetchSalesDataForRange(store.id, previousDay, previousDay);
            const previousWeekSales = await fetchSalesDataForRange(store.id, previousWeek, previousWeek);
            const previousMonthSales = await fetchSalesDataForRange(store.id, previousMonth, previousMonth);
            const currentMonthSales = await fetchSalesDataForRange(store.id, currentMonthStart, currentMonthEnd);
            return {
                storeName: store.storeName,
                address: store.address,
                salesData: {
                    totalNetAmount: currentSales.totalNetAmount,
                    totalBills: currentSales.totalBills,
                    totalItemsSold: currentSales.totalItemsSold,
                    isUploaded: currentSales.isUploaded,
                    lastUploadDate: currentSales.lastUploadDate,
                },
                trends: {
                    previousDay: previousDaySales,
                    previousWeek: previousWeekSales,
                    previousMonth: previousMonthSales,
                    currentMonth: currentMonthSales,
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
            const lastPurchaseDate = customer.bills.length
                ? new Date(customer.bills[0].date)
                : null;
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
const getInactiveCustomers = async (req, res) => {
    try {
        const { fromDate, toDate, page = 1, pageSize = 100 } = req.query;
        const today = new Date();
        const defaultFromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const defaultToDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
        const startDate = fromDate ? new Date(fromDate) : defaultFromDate;
        const endDate = toDate ? new Date(toDate) : defaultToDate;
        const skip = (Number(page) - 1) * Number(pageSize);
        const take = Number(pageSize);
        const customers = await exports.prisma.customer.findMany({
            where: {
                bills: {
                    none: {
                        date: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                },
            },
            select: {
                id: true,
                name: true,
                phone: true,
                bills: {
                    select: { date: true, store: { select: { storeName: true } } },
                    orderBy: { date: "desc" },
                    take: 1,
                },
            },
            skip,
            take,
        });
        const telecallingCustomers = await exports.prisma.telecallingCustomer.findMany({
            where: {
                customerId: { in: customers.map((customer) => customer.id) },
            },
            select: {
                customerId: true,
                updatedAt: true,
            },
        });
        const lastCalledDateMap = new Map(telecallingCustomers.map((entry) => [entry.customerId, entry.updatedAt]));
        const result = customers
            .filter((customer) => {
            const lastPurchaseDate = customer.bills.length
                ? new Date(customer.bills[0].date)
                : null;
            return !lastPurchaseDate || lastPurchaseDate <= endDate;
        })
            .map((customer) => ({
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            lastPurchaseDate: customer.bills.length
                ? customer.bills[0].date.toISOString()
                : null,
            storeName: customer.bills.length
                ? customer.bills[0].store?.storeName || null
                : null,
            lastCalledDate: lastCalledDateMap.get(customer.id)?.toISOString() || null,
        }));
        const totalCount = await exports.prisma.customer.count({
            where: {
                bills: {
                    none: {
                        date: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                },
            },
        });
        const hasMore = skip + take < totalCount;
        res.json({
            items: result,
            totalCount,
            hasMore,
        });
    }
    catch (error) {
        console.error("Error fetching inactive customers:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getInactiveCustomers = getInactiveCustomers;
const getCustomerPurchaseHistory = async (req, res) => {
    try {
        const { customerId } = req.params;
        if (!customerId) {
            res.status(400).json({ error: "Customer ID is required" });
            return;
        }
        const currentDate = new Date();
        const pastYearStart = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);
        const bills = await exports.prisma.bill.findMany({
            where: {
                customerId: Number(customerId),
                date: {
                    gte: pastYearStart,
                    lte: currentDate,
                },
            },
            include: {
                billDetails: true,
            },
            orderBy: {
                date: "desc",
            },
        });
        const monthlyData = bills.reduce((acc, bill) => {
            const monthKey = `${bill.date.getFullYear()}-${bill.date.getMonth() + 1}`;
            if (!acc[monthKey]) {
                acc[monthKey] = { totalAmount: 0, totalBills: 0, dailyData: {} };
            }
            const billAmount = bill.amountPaid - bill.creditAmount;
            acc[monthKey].totalAmount += billAmount;
            acc[monthKey].totalBills += 1;
            const dayKey = bill.date.toISOString().split("T")[0];
            if (!acc[monthKey].dailyData[dayKey]) {
                acc[monthKey].dailyData[dayKey] = { totalAmount: 0, bills: [] };
            }
            acc[monthKey].dailyData[dayKey].totalAmount += billAmount;
            acc[monthKey].dailyData[dayKey].bills.push({
                billNo: bill.billNo,
                amount: billAmount,
                medicines: bill.billDetails.map((detail) => ({
                    name: detail.item,
                    quantity: detail.quantity,
                })),
            });
            return acc;
        }, {});
        res.status(200).json(monthlyData);
    }
    catch (error) {
        console.error("Error fetching customer purchase history:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getCustomerPurchaseHistory = getCustomerPurchaseHistory;
const getBillDetailsByBillNo = async (req, res) => {
    try {
        const { billNo } = req.params;
        if (!billNo) {
            res.status(400).json({ error: "Bill number is required" });
            return;
        }
        const bill = await exports.prisma.bill.findUnique({
            where: { billNo },
            include: {
                customer: true,
                store: true,
                billDetails: true,
            },
        });
        if (!bill) {
            res.status(404).json({ error: "Bill not found" });
            return;
        }
        res.status(200).json(bill);
    }
    catch (error) {
        console.error("Error fetching bill details:", error);
        res.status(500).json({ error: "Failed to fetch bill details" });
    }
};
exports.getBillDetailsByBillNo = getBillDetailsByBillNo;
const getUploadStatusByMonth = async (req, res) => {
    try {
        const { year, month, storeId, storeName } = req.query;
        if (!year || !month) {
            res.status(400).json({ error: "Year and month are required." });
            return;
        }
        const yearInt = parseInt(year, 10);
        const monthInt = parseInt(month, 10);
        if (isNaN(yearInt) || isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
            res.status(400).json({ error: "Invalid year or month." });
            return;
        }
        const startDate = new Date(Date.UTC(yearInt, monthInt - 1, 1));
        const endDate = new Date(Date.UTC(yearInt, monthInt, 0, 23, 59, 59));
        let storeFilter = undefined;
        if (storeName) {
            const store = await exports.prisma.store.findFirst({
                where: {
                    storeName: { equals: storeName, mode: "insensitive" }
                },
                select: { id: true },
            });
            if (!store) {
                res.status(404).json({ error: "Store not found." });
                return;
            }
            storeFilter = store.id;
        }
        else if (storeId) {
            storeFilter = parseInt(storeId, 10);
            if (isNaN(storeFilter)) {
                res.status(400).json({ error: "Invalid store ID." });
                return;
            }
        }
        const bills = await exports.prisma.bill.findMany({
            where: {
                storeId: storeFilter,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                date: true,
            },
        });
        const uploadStatusMap = {};
        bills.forEach((bill) => {
            const dateKey = bill.date.toISOString().split("T")[0];
            uploadStatusMap[dateKey] = true;
        });
        const daysInMonth = new Date(yearInt, monthInt, 0).getDate();
        const result = Array.from({ length: daysInMonth }, (_, i) => {
            const date = new Date(Date.UTC(yearInt, monthInt - 1, i + 1));
            const dateKey = date.toISOString().split("T")[0];
            return {
                date: dateKey,
                isUploaded: uploadStatusMap[dateKey] || false,
            };
        });
        res.status(200).json(result);
    }
    catch (error) {
        console.error("Error fetching upload status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getUploadStatusByMonth = getUploadStatusByMonth;
const getStores = async (_req, res) => {
    try {
        const stores = await exports.prisma.store.findMany({
            select: {
                id: true,
                storeName: true,
                address: true,
            },
        });
        res.status(200).json(stores);
    }
    catch (error) {
        console.error("Error fetching stores:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.getStores = getStores;
//# sourceMappingURL=reportController.js.map