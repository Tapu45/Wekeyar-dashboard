export interface SummaryReport {
    totalCustomers: number;
    activeCustomers: number;
    inactiveCustomers: number;
    totalRevenue: number;
    avgMonthlyRevenue: number;
  }
  
  export interface NonBuyingCustomer {
    id: number;
    name: string;
    phone: string;
    lastPurchaseDate: Date | null;
    totalPurchaseValue: number;
  }
  
  export interface MonthlyNonBuyingCustomer {
    id: number;
    name: string;
    phone: string;
    monthlyAvgPurchase: number;
    lastPurchaseDate: Date | null;
  }

  export interface CustomerReport {
    success: boolean;
    data: CustomerReportData[];
  }
  
  export interface CustomerReportData {
    customerName: string;
    mobileNo: string;
    totalSales: number;
    purchaseFrequency: number;
    stores: StoreSales[];
  }
  
  export interface StoreSales {
    storeName: string;
    sales: number;
  }

  export interface StoreWiseSalesReport {
    selectedDate: string;
    storeReports: StoreReport[];
  }
  
  export interface StoreReport {
    storeName: string;
    address: string;
    salesData: SalesData;
    trends: Trends;
  }
  
  export interface SalesData {
    totalNetAmount: number;
    totalBills: number;
    totalItemsSold: number;
    isUploaded: boolean;
  }
  
  export interface Trends {
    previousDay: TrendData;
    previousWeek: TrendData;
    previousMonth: TrendData;
  }
  
  export interface TrendData {
    totalNetAmount: number;
    totalBills: number;
    totalItemsSold: number;
    isUploaded: boolean;
  }

  export interface Customer {
    name: string;
    phone: string;
    address: string;
    status: "Active" | "Inactive";
  }

  export interface YearlyRevenue {
    year: number;
    revenue: number;
  }

  export interface MonthlyRevenue {
    month: number;
    monthName: string;
    revenue: number;
  }

  export type AvailableYears = number[];
  