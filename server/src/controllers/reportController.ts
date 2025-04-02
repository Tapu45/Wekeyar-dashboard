import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { NonBuyingCustomer, MonthlyNonBuyingCustomer } from "src/types/types";
import { subDays, subWeeks, subMonths } from "date-fns";

export const prisma = new PrismaClient();

/**
 * 1. Summary Report
 */
export const getSummary = async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate, storeId } = req.query;

    // Default date range: current month and previous month
    const today = new Date();
    const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

    const startDate = fromDate ? new Date(fromDate as string) : previousMonthStart;
    const endDate = toDate ? new Date(toDate as string) : previousMonthEnd;

    // Total customers count
    const totalCustomers = await prisma.customer.count();

    // Fetch inactive customers (customers with no bills in the specified date range)
    const inactiveCustomers = await prisma.customer.findMany({
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
        bills: {
          select: { date: true },
          orderBy: { date: "desc" },
          take: 1,
        },
      },
    });

    // Apply additional filtering to exclude customers whose last purchase date is after the `endDate`
    const filteredInactiveCustomers = inactiveCustomers.filter((customer) => {
      const lastPurchaseDate = customer.bills.length
        ? new Date(customer.bills[0].date)
        : null;

      // Include customers with no purchase history or last purchase before `endDate`
      return !lastPurchaseDate || lastPurchaseDate <= endDate;
    });

    const inactiveCustomerCount = filteredInactiveCustomers.length;

    // Calculate active customers by subtracting inactive customers from total customers
    const activeCustomerCount = totalCustomers - inactiveCustomerCount;

    // Total revenue
    const totalRevenueData = await prisma.bill.aggregate({
      _sum: { netAmount: true },
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        ...(storeId ? { storeId: Number(storeId) } : {}),
      },
    });

    // Calculate average monthly revenue
    const avgMonthlyRevenue = totalRevenueData._sum.netAmount
      ? totalRevenueData._sum.netAmount / 12
      : 0;

    // Prepare the summary response
    const summary = {
      totalCustomers,
      activeCustomers: activeCustomerCount,
      inactiveCustomers: inactiveCustomerCount,
      totalRevenue: totalRevenueData._sum.netAmount || 0,
      avgMonthlyRevenue,
    };

    res.json(summary);
  } catch (error) {
    console.error("Error in getSummary:", error);
    res.status(500).json({ error: "Internal server error" });
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
      totalPurchaseValue: customer.bills.reduce(
        (acc, bill) => acc + bill.netAmount,
        0
      ),
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error", details: error });
  }
};

/**
 * 3. Non-Buying Customer List (Monthly Buyers)
 */
export const getNonBuyingMonthlyCustomers = async (
  _req: Request,
  res: Response
) => {
  try {
    const currentDate = new Date();
    const currentMonthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    const customers = await prisma.customer.findMany({
      where: {
        bills: {
          none: { date: { gte: currentMonthStart } }, // No bills in the current month
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
      const totalAmount = customer.bills.reduce(
        (acc, bill) => acc + bill.netAmount,
        0
      );
      const monthsCount = new Set(
        customer.bills.map(
          (bill) => `${bill.date.getFullYear()}-${bill.date.getMonth()}`
        )
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
export const getCustomerReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate, storeId, search, billNo } = req.query;

    // Convert query params to proper types
    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const whereCondition: any = {};

    // Filter by date range
    if (start && end) {
      whereCondition.date = {
        gte: start,
        lte: end,
      };
    }

    // Filter by store ID
    if (storeId) {
      whereCondition.storeId = Number(storeId);
    }

    // Filter by bill number
    if (billNo) {
      whereCondition.billNo = billNo as string;
    }

    // Filter by customer name or phone
    if (search) {
      whereCondition.OR = [
        {
          customer: {
            name: { contains: search as string, mode: "insensitive" },
          },
        },
        {
          customer: {
            phone: { contains: search as string, mode: "insensitive" },
          },
        },
      ];
    }

    // Fetch all relevant bills
    const bills = await prisma.bill.findMany({
      where: whereCondition,
      include: {
        customer: true, // Include customer details
        billDetails: true, // Include medicine details
      },
      orderBy: {
        date: "desc", // Ensure bills are ordered by date
      },
    });

    // Group data by customer
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
          dates: new Map(), // Group bills by date
        });
      }

      const customerEntry = customerData.get(id);

      // Update total bills and total amount
      customerEntry.totalBills += 1;
      customerEntry.totalAmount += bill.amountPaid; // Use amountPaid instead of netAmount

      // Group bills by date
      const dateKey = bill.date.toISOString().split("T")[0];
      if (!customerEntry.dates.has(dateKey)) {
        customerEntry.dates.set(dateKey, {
          date: dateKey,
          totalAmount: 0,
          salesBills: [], // Separate sales bills
          returnBills: [], // Separate return bills
        });
      }

      const dateEntry = customerEntry.dates.get(dateKey);
      dateEntry.totalAmount += bill.amountPaid; // Use amountPaid instead of netAmount

      // Group bills into sales or returns based on billNo prefix
      if (bill.billNo.startsWith("CS")) {
        dateEntry.salesBills.push({
          billNo: bill.billNo,
          amount: bill.amountPaid,
          medicines: bill.billDetails.map((detail) => ({
            name: detail.item,
            quantity: detail.quantity,
          })),
        });
      } else if (bill.billNo.startsWith("CN")) {
        dateEntry.returnBills.push({
          billNo: bill.billNo,
          amount: bill.amountPaid,
          medicines: bill.billDetails.map((detail) => ({
            name: detail.item,
            quantity: detail.quantity,
          })),
        });
      }
    });

    // Convert Map to JSON-friendly format
    const result = Array.from(customerData.values()).map((customer) => ({
      ...customer,
      dates: Array.from(customer.dates.values()),
    }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching customer report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * 5. Store-wise Sales Report
 */
export const getStoreWiseSalesReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { date, searchQuery } = req.query;

    // Default to today's date if no date is provided
    const selectedDate = date ? new Date(date as string) : new Date();

    const previousDay = subDays(selectedDate, 1);
    const previousWeek = subWeeks(selectedDate, 1);
    const previousMonth = subMonths(selectedDate, 1);

    // Calculate the start and end of the current month
    const currentMonthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const currentMonthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59);

    // Fetch stores with optional filtering by searchQuery
    const stores = await prisma.store.findMany({
      where: {
        OR: searchQuery
          ? [
              { storeName: { contains: searchQuery as string, mode: "insensitive" } },
              { address: { contains: searchQuery as string, mode: "insensitive" } },
            ]
          : undefined,
      },
    });

    // Function to get sales data for a specific date range
    const fetchSalesDataForRange = async (storeId: number, startDate: Date, endDate: Date) => {
      const sales = await prisma.bill.findMany({
        where: {
          storeId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          netAmount: true,
          isUploaded: true,
          createdAt: true, // Fetch the creation date for upload tracking
          billDetails: {
            select: {
              id: true, // Counting items sold
            },
          },
        },
      });

      // Find the last upload date
      const lastUploadDate = sales.length > 0
        ? sales.reduce((latest, bill) => (bill.createdAt > latest ? bill.createdAt : latest), sales[0].createdAt)
        : null;

      return {
        totalNetAmount: sales.reduce((sum, bill) => sum + bill.netAmount, 0),
        totalBills: sales.length,
        totalItemsSold: sales.reduce(
          (sum, bill) => sum + bill.billDetails.length,
          0
        ),
        isUploaded: sales.length > 0 ? sales[0].isUploaded : false,
        lastUploadDate: lastUploadDate ? lastUploadDate.toISOString() : null, // Format the date
      };
    };

    // Generate report for all stores
    const storeReports = await Promise.all(
      stores.map(async (store) => {
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
            lastUploadDate: currentSales.lastUploadDate, // Include the last upload date
          },
          trends: {
            previousDay: previousDaySales,
            previousWeek: previousWeekSales,
            previousMonth: previousMonthSales,
            currentMonth: currentMonthSales,
          },
        };
      })
    );

    res.status(200).json({
      selectedDate: selectedDate.toISOString().split("T")[0],
      storeReports,
    });
  } catch (error) {
    console.error("Error fetching store-wise sales report:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllCustomers = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const currentDate = new Date();
    const lastMonthStart = new Date(
      Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() - 1, 1)
    );
    const lastMonthEnd = new Date(
      Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        0,
        23,
        59,
        59
      )
    );

    console.log("Last Month Start (UTC):", lastMonthStart.toISOString());
    console.log("Last Month End (UTC):", lastMonthEnd.toISOString());

    // Fetch all customers with their most recent purchase date
    const customers = await prisma.customer.findMany({
      select: {
        name: true,
        phone: true,
        address: true,
        bills: {
          select: { date: true },
          orderBy: { date: "desc" },
          take: 1, // Get the most recent bill
        },
      },
    });

    console.log("Fetched Customers:", customers);

    // Process each customer to determine active/inactive status
    const result = customers.map((customer) => {
      const lastPurchaseDate = customer.bills.length
        ? new Date(customer.bills[0].date)
        : null;

      console.log(
        `Customer: ${customer.name}, Last Purchase (Raw):`,
        customer.bills[0]?.date
      );
      console.log(
        `Customer: ${customer.name}, Last Purchase (Parsed):`,
        lastPurchaseDate?.toISOString()
      );

      let isActive = false;
      if (lastPurchaseDate) {
        isActive =
          lastPurchaseDate.getTime() >= lastMonthStart.getTime() &&
          lastPurchaseDate.getTime() <= lastMonthEnd.getTime();
      }

      console.log(
        `Customer: ${customer.name}, Status: ${
          isActive ? "Active" : "Inactive"
        }`
      );

      return {
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        status: isActive ? "Active" : "Inactive",
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getInactiveCustomers = async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate } = req.query;

    // Default date range: current month and previous month
    const today = new Date();
    const defaultFromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const defaultToDate = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

    const startDate = fromDate ? new Date(fromDate as string) : defaultFromDate;
    const endDate = toDate ? new Date(toDate as string) : defaultToDate;

    // Fetch customers with no bills in the specified date range
    const customers = await prisma.customer.findMany({
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
    });

    // Fetch statuses from the TelecallingCustomer table
    const telecallingStatuses = await prisma.telecallingCustomer.findMany({
      where: {
        customerId: { in: customers.map((customer) => customer.id) },
      },
      select: {
        customerId: true,
        status: true,
      },
    });

    // Create a map of statuses for quick lookup
    const statusMap = new Map(
      telecallingStatuses.map((entry) => [entry.customerId, entry.status])
    );

    // Filter out customers whose last purchase date is after the `endDate`
    const result = customers
      .filter((customer) => {
        const lastPurchaseDate = customer.bills.length
          ? new Date(customer.bills[0].date)
          : null;

        // Include customers with no purchase history or last purchase before `endDate`
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
        status: statusMap.get(customer.id) || "inactive", // Default to "inactive" if no status is found
      }));

    res.json(result);
  } catch (error) {
    console.error("Error fetching inactive customers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const getBillDetailsByBillNo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { billNo } = req.params;

    // Validate billNo
    if (!billNo) {
      res.status(400).json({ error: "Bill number is required" });
      return;
    }

    // Fetch the bill details
    const bill = await prisma.bill.findUnique({
      where: { billNo },
      include: {
        customer: true, // Include customer details
        store: true,    // Include store details
        billDetails: true, // Include bill details (items, quantity, etc.)
      },
    });

    // If no bill is found, return an error
    if (!bill) {
     res.status(404).json({ error: "Bill not found" });
      return;
    }

    // Return the bill details
    res.status(200).json(bill);
  } catch (error) {
    console.error("Error fetching bill details:", error);
    res.status(500).json({ error: "Failed to fetch bill details" });
  }
};

export const getUploadStatusByMonth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { year, month, storeId, storeName } = req.query;

    // Validate input
    if (!year || !month) {
      res.status(400).json({ error: "Year and month are required." });
      return;
    }

    const yearInt = parseInt(year as string, 10);
    const monthInt = parseInt(month as string, 10);

    if (isNaN(yearInt) || isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
      res.status(400).json({ error: "Invalid year or month." });
      return;
    }

    // Calculate the start and end dates of the selected month
    const startDate = new Date(Date.UTC(yearInt, monthInt - 1, 1)); // Start of the month (UTC)
    const endDate = new Date(Date.UTC(yearInt, monthInt, 0, 23, 59, 59)); // End of the month (UTC)

    let storeFilter: number | undefined = undefined;

    // Handle storeName or storeId
    if (storeName) {
      const store = await prisma.store.findFirst({
        where: { 
          storeName: { equals: storeName as string, mode: "insensitive" } // Case-insensitive match
        },
        select: { id: true },
      });
    
      if (!store) {
        res.status(404).json({ error: "Store not found." });
        return;
      }
    
      storeFilter = store.id; // Use the store ID from the store name
    } else if (storeId) {
      storeFilter = parseInt(storeId as string, 10);

      if (isNaN(storeFilter)) {
        res.status(400).json({ error: "Invalid store ID." });
        return;
      }
    }

    // Fetch bills for the selected store and date range
    const bills = await prisma.bill.findMany({
      where: {
        storeId: storeFilter, // Use the store filter if provided
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        date: true,
      },
    });

    // Create a map of dates with upload status
    const uploadStatusMap: { [key: string]: boolean } = {};
    bills.forEach((bill) => {
      const dateKey = bill.date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
      uploadStatusMap[dateKey] = true;
    });

    // Generate the response for each day of the month
    const daysInMonth = new Date(yearInt, monthInt, 0).getDate();
    const result = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(Date.UTC(yearInt, monthInt - 1, i + 1)); // Ensure UTC date
      const dateKey = date.toISOString().split("T")[0];
      return {
        date: dateKey,
        isUploaded: uploadStatusMap[dateKey] || false,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching upload status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


