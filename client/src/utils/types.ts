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
  