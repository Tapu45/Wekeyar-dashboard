import * as XLSX from "xlsx";
import { NonBuyingCustomer } from "./types";

// Interface for customer data
interface Customer {
  customerName: string;
  mobileNo: string;
  totalBills: number;
  totalAmount: number;
  dates?: Array<{
    date: string;
    totalAmount: number;
    salesBills: Array<{
      medicines: any; billNo: string; amount: number 
}>;
    returnBills: Array<{ billNo: string; amount: number }>;
  }>;
}

/**
 * Export basic customer details to Excel with improved formatting
 */
export const exportDetailedToExcel = (data: Customer[], filters?: { 
  startDate?: string, 
  endDate?: string, 
  store?: string, 
  search?: string 
}) => {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Calculate totals
  const totalAmount = data.reduce((sum, customer) => {
    return sum + (customer.totalAmount || 0);
  }, 0);
  
  const totalQuantity = data.reduce((sum, customer) => {
    if (!customer.dates) return sum;
    return sum + customer.dates.reduce((dateSum, date) => {
      return dateSum + date.salesBills.reduce((billSum, bill) => {
        return billSum + bill.medicines.reduce((medSum: any, med: any) => {
          return medSum + (med.quantity || 0);
        }, 0);
      }, 0);
    }, 0);
  }, 0);
  
  // Prepare header data
  const headerData = [
    ["CUSTOMER DETAILED REPORT"],
    [""],
    ["Report Generated:", new Date().toLocaleString('en-IN')],
    ["Period:", filters?.startDate ? `${filters.startDate} to ${filters?.endDate}` : "All Time"],
    ["Store:", filters?.store || "All Stores"],
    ["Search Filter:", filters?.search || "None"],
    ["Total Customers:", data.length.toString()],
    ["Total Amount:", totalAmount.toString()],
    ["Total Quantity:", totalQuantity.toString()],
    [""],
    [""] // Extra empty row before customer data begins
  ];
  
  // Flatten the data to match the desired layout
  const detailedData = data.flatMap((customer) => {
    if (!customer.dates) return [];

    return customer.dates.flatMap((date) => {
      return date.salesBills.flatMap((bill) => {
        return bill.medicines.map((medicine: { name: any; quantity: any; }) => [
          customer.customerName,
          customer.mobileNo,
          date.date,
          date.totalAmount,
          bill.billNo,
          medicine.name,
          medicine.quantity,
        ]);
      });
    });
  });
  
  // Add column headers
  const columnHeaders = [
    ["Customer Name", "Mobile Number", "Date", "Total Amount", "Bill No", "Medicine Name", "Quantity"]
  ];
  
  // Combine all data
  const allData = [...headerData, ...columnHeaders, ...detailedData];
  
  // Create the worksheet with all data combined
  const ws = XLSX.utils.aoa_to_sheet(allData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, // Customer Name
    { wch: 15 }, // Mobile Number
    { wch: 12 }, // Date
    { wch: 15 }, // Total Amount
    { wch: 12 }, // Bill No
    { wch: 30 }, // Medicine Name
    { wch: 10 }, // Quantity
  ];
  
  // Merge cells for the title
  if(!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, ws, "Customer Detailed Report");

  // Write file
  XLSX.writeFile(workbook, "CustomerReport_Detailed.xlsx");
};


/**
 * Export basic customer details to Excel with improved formatting
 */
export const exportNormalToExcel = (data: Customer[], filters?: { 
  startDate?: string, 
  endDate?: string, 
  store?: string, 
  search?: string 
}) => {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Calculate totals
  const totalAmount = data.reduce((sum, customer) => {
    return sum + (customer.totalAmount || 0);
  }, 0);

  const totalBills = data.reduce((sum, customer) => {
    return sum + (customer.totalBills || 0);
  }, 0);
  
  // Prepare header data
  const headerData = [
    ["CUSTOMER SUMMARY REPORT"],
    [""],
    ["Report Generated:", new Date().toLocaleString('en-IN')],
    ["Period:", filters?.startDate ? `${filters.startDate} to ${filters?.endDate}` : "All Time"],
    ["Store:", filters?.store || "All Stores"],
    ["Search Filter:", filters?.search || "None"],
    ["Total Customers:", data.length.toString()],
    ["Total Amount:", totalAmount.toString()],
    ["Total Bills:", totalBills.toString()],
    [""],
    [""] // Extra empty row before customer data begins
  ];
  
  // Add column headers
  const columnHeaders = [
    ["Customer Name", "Mobile Number", "Total Bills", "Total Amount"]
  ];
  
  // Format customer data as array of arrays
  const customerData = data.map((customer) => [
    customer.customerName,
    customer.mobileNo,
    customer.totalBills,
    customer.totalAmount 
  ]);
  
  // Combine all data
  const allData = [...headerData, ...columnHeaders, ...customerData];
  
  // Create the worksheet with all data combined
  const ws = XLSX.utils.aoa_to_sheet(allData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, // Customer Name
    { wch: 15 }, // Mobile Number
    { wch: 12 }, // Total Bills
    { wch: 15 }  // Total Amount
  ];
  
  // Merge cells for the title
  if(!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } });
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, ws, "Customer Summary");

  // Write file
  XLSX.writeFile(workbook, "CustomerReport_Basic.xlsx");
};



export const exportNonBuyingToExcel = (data: NonBuyingCustomer[], filters?: {
  days?: number,
  store?: string
}) => {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  // Create workbook
  const workbook = XLSX.utils.book_new();
  
  // Prepare header data
  const headerData = [
    ["NON-BUYING CUSTOMERS REPORT"],
    [""],
    ["Report Generated:", new Date().toLocaleString('en-IN')],
    ["Inactive Period:", filters?.days ? `${filters.days} days` : "Not specified"],
    ["Store:", filters?.store || "All Stores"],
    ["Total Inactive Customers:", data.length.toString()],
    [""],
    [""] // Extra empty row before customer data begins
  ];
  
  // Add column headers
  const columnHeaders = [
    ["Customer Name", "Phone Number", "Last Purchase Date", "Total Purchase Value"]
  ];
  
  // Format customer data as array of arrays
  const customerData = data.map((customer) => [
    customer.name,
    customer.phone,
    customer.lastPurchaseDate
      ? new Date(customer.lastPurchaseDate).toLocaleDateString("en-IN")
      : "Never",
    `₹${customer.totalPurchaseValue.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`
  ]);
  
  // Combine all data
  const allData = [...headerData, ...columnHeaders, ...customerData];
  
  // Create the worksheet with all data combined
  const ws = XLSX.utils.aoa_to_sheet(allData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 25 }, // Customer Name
    { wch: 15 }, // Phone Number
    { wch: 15 }, // Last Purchase Date
    { wch: 18 }  // Total Purchase Value
  ];
  
  // Merge cells for the title
  if(!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } });
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, ws, "Non-Buying Customers");

  // Write file
  const filename = `NonBuyingCustomers_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, filename);
};

