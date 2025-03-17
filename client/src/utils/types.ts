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
  