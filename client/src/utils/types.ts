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
    success: boolean; // Indicates if the API call was successful
    data: CustomerReportData[]; // Array of customer report data
  }
  
  export interface CustomerReportData {
    customerName: string; // Customer's name
    mobileNo: string; // Customer's mobile number
    totalSales: number; // Total sales amount
    totalProducts: number; // Total quantity of products purchased
    bills: BillDetails[]; // Array of bills
  }
  
  export interface BillDetails {
    billNo: string; // Bill number
    date: string; // Date of the bill
    medicines: MedicineDetails[]; // Array of medicines in the bill
  }
  
  export interface MedicineDetails {
    name: string; // Medicine name
    quantity: number; // Quantity of the medicine
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
  