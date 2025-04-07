import * as XLSX from "xlsx";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
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
    salesBills: Array<{ billNo: string; amount: number }>;
    returnBills: Array<{ billNo: string; amount: number }>;
  }>;
}

/**
 * Export basic customer details to Excel with improved formatting
 */
export const exportNormalToExcel = (data: Customer[]) => {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  const formattedData = data.map((customer) => ({
    "Customer Name": customer.customerName,
    "Mobile Number": customer.mobileNo,
    "Total Bills": customer.totalBills,
    "Total Amount": `Rs${customer.totalAmount.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    })}`
  }));

  // Create worksheet and workbook
  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  
  // Set column widths
  const columnWidths = [
    { wch: 25 }, // Customer Name
    { wch: 15 }, // Mobile Number
    { wch: 12 }, // Total Bills
    { wch: 15 }  // Total Amount
  ];
  worksheet["!cols"] = columnWidths;
  
  // Add styling
  // Note: Basic styling with Excel, more advanced styling would require additional libraries
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Report");

  // Write file
  XLSX.writeFile(workbook, "CustomerReport_Basic.xlsx");
};

/**
 * Export detailed customer data to Excel with improved formatting
 */
export const exportDetailedToExcel = (data: Customer[]) => {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  const detailedData = data.flatMap((customer) => {
    if (!customer.dates) return [];
    
    return customer.dates.map(date => ({
      "Customer Name": customer.customerName,
      "Mobile Number": customer.mobileNo,
      "Date": date.date,
      "Total Amount": `Rs${date.totalAmount.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
      })}`,
      "Sales Bills": date.salesBills
        .map(bill => `Bill No: ${bill.billNo}, Amount: Rs${bill.amount.toLocaleString('en-IN', {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2
        })}`)
        .join("\n"),
      "Return Bills": date.returnBills.length > 0 
        ? date.returnBills
            .map(bill => `Bill No: ${bill.billNo}, Amount: Rs${bill.amount.toLocaleString('en-IN', {
              maximumFractionDigits: 2,
              minimumFractionDigits: 2
            })}`)
            .join("\n")
        : "None"
    }));
  });

  // Create worksheet and workbook
  const worksheet = XLSX.utils.json_to_sheet(detailedData);
  const workbook = XLSX.utils.book_new();
  
  // Set column widths
  const columnWidths = [
    { wch: 25 }, // Customer Name
    { wch: 15 }, // Mobile Number
    { wch: 12 }, // Date
    { wch: 15 }, // Total Amount
    { wch: 40 }, // Sales Bills
    { wch: 40 }  // Return Bills
  ];
  worksheet["!cols"] = columnWidths;
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Detailed Customer Report");

  // Write file
  XLSX.writeFile(workbook, "CustomerReport_Detailed.xlsx");
};

/**
 * Export basic customer details to PDF with improved formatting
 */
export const exportNormalToPDF = async (data: Customer[]) => {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([612, 792]); // Standard US Letter size
  
  // Embed fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Set margins and starting positions
  const margin = 50;
  const pageWidth = page.getWidth() - margin * 2;
  let yPosition = page.getHeight() - margin;
  
  // Draw title
  page.drawText("Customer Report", {
    x: margin,
    y: yPosition,
    size: 18,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 30;
  
  // Add date
  const today = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  page.drawText(`Generated on: ${today}`, {
    x: margin,
    y: yPosition,
    size: 10,
    font: helvetica,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 30;
  
  // Draw table header
  const colWidths = [pageWidth * 0.35, pageWidth * 0.25, pageWidth * 0.15, pageWidth * 0.25];
  const headers = ["Customer Name", "Mobile Number", "Total Bills", "Total Amount"];
  
  // Draw header background
  page.drawRectangle({
    x: margin,
    y: yPosition - 15,
    width: pageWidth,
    height: 20,
    color: rgb(0.9, 0.9, 0.9),
  });
  
  let xPosition = margin;
  for (let i = 0; i < headers.length; i++) {
    page.drawText(headers[i], {
      x: xPosition + 5,
      y: yPosition - 10,
      size: 10,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    xPosition += colWidths[i];
  }
  
  yPosition -= 25;
  
  // Draw data rows
  for (const customer of data) {
    // Check if we need a new page
    if (yPosition < margin + 50) {
      page = pdfDoc.addPage([612, 792]);
      yPosition = page.getHeight() - margin;
    }
    
    // Draw light background for alternate rows
    if (data.indexOf(customer) % 2 === 1) {
      page.drawRectangle({
        x: margin,
        y: yPosition - 15,
        width: pageWidth,
        height: 20,
        color: rgb(0.95, 0.95, 0.95),
      });
    }
    
    // Draw row data
    const rowData = [
      customer.customerName, 
      customer.mobileNo, 
      customer.totalBills.toString(),
      `Rs${customer.totalAmount.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
      })}`
    ];
    
    xPosition = margin;
    for (let i = 0; i < rowData.length; i++) {
      page.drawText(rowData[i], {
        x: xPosition + 5,
        y: yPosition - 10,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
      xPosition += colWidths[i];
    }
    
    yPosition -= 25;
  }
  
  // Draw footer
  yPosition = margin + 30;
  page.drawText("© Your Company Name - All Rights Reserved", {
    x: margin,
    y: yPosition,
    size: 8,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  // Save PDF
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "CustomerReport_Basic.pdf";
  link.click();
};

/**
 * Export detailed customer data to PDF with improved formatting
 */
export const exportDetailedToPDF = async (data: Customer[]) => {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  const pdfDoc = await PDFDocument.create();
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Add cover page
  let page = pdfDoc.addPage([612, 792]); // Standard US Letter size
  
  // Set margins and starting positions
  const margin = 50;
  const pageWidth = page.getWidth() - margin * 2;
  let yPosition = page.getHeight() - 200;
  
  // Draw title
  page.drawText("Detailed Customer Report", {
    x: margin,
    y: yPosition,
    size: 24,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 40;
  
  // Add date
  const today = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  page.drawText(`Generated on: ${today}`, {
    x: margin,
    y: yPosition,
    size: 12,
    font: helvetica,
    color: rgb(0, 0, 0),
  });
  
  yPosition -= 40;
  
  page.drawText(`Total Customers: ${data.length}`, {
    x: margin,
    y: yPosition,
    size: 12,
    font: helvetica,
    color: rgb(0, 0, 0),
  });
  
  // Add customers' data pages
  for (const customer of data) {
    if (!customer.dates || customer.dates.length === 0) continue;
    
    // Add a new page for each customer
    page = pdfDoc.addPage([612, 792]);
    yPosition = page.getHeight() - margin;
    
    // Customer header
    page.drawRectangle({
      x: margin,
      y: yPosition - 15,
      width: pageWidth,
      height: 30,
      color: rgb(0.9, 0.9, 0.9),
    });
    
    page.drawText(`Customer: ${customer.customerName}`, {
      x: margin + 10,
      y: yPosition - 10,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 30;
    
    page.drawText(`Mobile: ${customer.mobileNo}`, {
      x: margin + 10,
      y: yPosition,
      size: 12,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`Total Bills: ${customer.totalBills}`, {
      x: margin + 200,
      y: yPosition,
      size: 12,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`Total Amount: Rs${customer.totalAmount.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    })}`, {
      x: margin + 350,
      y: yPosition,
      size: 12,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 30;
    
    // Draw table for each date
    for (const date of customer.dates) {
      // Check if we need a new page
      if (yPosition < margin + 150) {
        page = pdfDoc.addPage([612, 792]);
        yPosition = page.getHeight() - margin;
      }
      
      // Date header
      page.drawRectangle({
        x: margin,
        y: yPosition - 15,
        width: pageWidth,
        height: 25,
        color: rgb(0.8, 0.8, 0.9),
      });
      
      page.drawText(`Date: ${date.date}`, {
        x: margin + 10,
        y: yPosition - 10,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      
      page.drawText(`Amount: Rs${date.totalAmount.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
      })}`, {
        x: pageWidth - 100,
        y: yPosition - 10,
        size: 12,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      });
      
      yPosition -= 35;
      
      // Sales Bills
      if (date.salesBills.length > 0) {
        page.drawText("Sales Bills:", {
          x: margin + 10,
          y: yPosition,
          size: 11,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        
        yPosition -= 20;
        
        for (const bill of date.salesBills) {
          // Check if we need a new page
          if (yPosition < margin + 50) {
            page = pdfDoc.addPage([612, 792]);
            yPosition = page.getHeight() - margin;
          }
          
          page.drawText(`Bill No: ${bill.billNo}`, {
            x: margin + 20,
            y: yPosition,
            size: 10,
            font: helvetica,
            color: rgb(0, 0, 0),
          });
          
          page.drawText(`Amount: Rs${bill.amount.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
          })}`, {
            x: margin + 200,
            y: yPosition,
            size: 10,
            font: helvetica,
            color: rgb(0, 0, 0),
          });
          
          yPosition -= 15;
        }
      }
      
      yPosition -= 10;
      
      // Return Bills
      if (date.returnBills.length > 0) {
        // Check if we need a new page
        if (yPosition < margin + 100) {
          page = pdfDoc.addPage([612, 792]);
          yPosition = page.getHeight() - margin;
        }
        
        page.drawText("Return Bills:", {
          x: margin + 10,
          y: yPosition,
          size: 11,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        
        yPosition -= 20;
        
        for (const bill of date.returnBills) {
          // Check if we need a new page
          if (yPosition < margin + 50) {
            page = pdfDoc.addPage([612, 792]);
            yPosition = page.getHeight() - margin;
          }
          
          page.drawText(`Bill No: ${bill.billNo}`, {
            x: margin + 20,
            y: yPosition,
            size: 10,
            font: helvetica,
            color: rgb(0, 0, 0),
          });
          
          page.drawText(`Amount: Rs${bill.amount.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
          })}`, {
            x: margin + 200,
            y: yPosition,
            size: 10,
            font: helvetica,
            color: rgb(0, 0, 0),
          });
          
          yPosition -= 15;
        }
      }
      
      yPosition -= 25; // Space between dates
    }
  }
  
  // Footer on last page
  page.drawText("© Your Company Name - All Rights Reserved", {
    x: margin,
    y: margin,
    size: 8,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  // Save PDF
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "CustomerReport_Detailed.pdf";
  link.click();
};


export const exportNonBuyingToExcel = (data: NonBuyingCustomer[]) => {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  const formattedData = data.map((customer) => ({
    "Customer Name": customer.name,
    "Phone Number": customer.phone,
    "Last Purchase Date": customer.lastPurchaseDate
      ? new Date(customer.lastPurchaseDate).toLocaleDateString("en-IN")
      : "Never",
    "Total Purchase Value": `Rs${customer.totalPurchaseValue.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`,
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Non-Buying Customers");

  XLSX.writeFile(workbook, "NonBuyingCustomers.xlsx");
};

/**
 * Export Non-Buying Customer data to PDF
 */
export const exportNonBuyingToPDF = async (data: NonBuyingCustomer[]) => {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([612, 792]); // Standard US Letter size
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let yPosition = page.getHeight() - 50;

  // Title
  page.drawText("Non-Buying Customers Report", {
    x: 50,
    y: yPosition,
    size: 18,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });

  yPosition -= 30;

  // Table Header
  const headers = ["Customer Name", "Phone Number", "Last Purchase Date", "Total Purchase Value"];
  const colWidths = [150, 150, 150, 150];

  headers.forEach((header, index) => {
    page.drawText(header, {
      x: 50 + colWidths.slice(0, index).reduce((a, b) => a + b, 0),
      y: yPosition,
      size: 10,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
  });

  yPosition -= 20;

  // Table Rows
  data.forEach((customer) => {
    if (yPosition < 50) {
      page = pdfDoc.addPage([612, 792]);
      yPosition = page.getHeight() - 50;
    }

    const row = [
      customer.name,
      customer.phone,
      customer.lastPurchaseDate
        ? new Date(customer.lastPurchaseDate).toLocaleDateString("en-IN")
        : "Never",
      `Rs${customer.totalPurchaseValue.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      })}`,
    ];

    row.forEach((cell, index) => {
      page.drawText(cell, {
        x: 50 + colWidths.slice(0, index).reduce((a, b) => a + b, 0),
        y: yPosition,
        size: 10,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
    });

    yPosition -= 20;
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "NonBuyingCustomers.pdf";
  link.click();
};