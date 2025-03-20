const { workerData, parentPort } = require('worker_threads');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const fs = require('fs');
const path = require('path');


const prisma = new PrismaClient();

async function processExcelFile() {
  try {
    const { fileUrl } = workerData;
    console.log(`Downloading file from Cloudinary: ${fileUrl}`);

      // Download the file from Cloudinary
      const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
      const tempFilePath = path.join(__dirname, "temp.xlsx");

      // / Save the downloaded file to a temporary location
    fs.writeFileSync(tempFilePath, response.data);
    console.log(`File downloaded and saved to: ${tempFilePath}`);
    
    // Read the Excel file
    const workbook = XLSX.readFile(tempFilePath, {
      cellDates: true,
      rawNumbers: false
    });
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: "", header: 'A' });
    console.log(`Parsed ${data.length} rows from Excel file`);

    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);
    
    // Track progress
    const totalRows = data.length;
    let processedRows = 0;
    
    const storeMap = new Map();
    const customerMap = new Map();
    let billMap = new Map();
    let totalBills = 0;
    let totalItems = 0;
    
    // Extract store information from the top of the file
    let storeName = '';
    let storeAddress = '';
    let storePhone = '';
    let storeEmail = '';
    
    // Scan first few rows for store information - IMPROVED LOGIC
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      
      // Extract row values as array to make processing easier
      const rowValues = Object.values(row).map(val => String(val || "").trim());
      const rowString = rowValues.join(' ');
      
      // Look for store name (first non-empty row that doesn't contain specific keywords)
      if (!storeName && rowString && 
          !rowString.includes('SALES STATEMENT') && 
          !rowString.includes('PLOT NO') &&
          !rowString.includes('Phone :')) {
        // Get the value from column A directly - this is typically where the store name is
        if (row.A && typeof row.A === 'string' && row.A.trim()) {
          storeName = row.A.trim();
          console.log(`Found store name: "${storeName}"`);
        }
      }
      
      // Look for address (typically contains "PLOT NO", "DISTRICT", etc.)
      if (!storeAddress && rowString && 
          (rowString.includes('PLOT NO') || 
           rowString.includes('AT.PLOT') || 
           rowString.includes('PIN CODE'))) {
        // Get the value from column A directly - this is typically where the address is
        if (row.A && typeof row.A === 'string' && row.A.trim()) {
          storeAddress = row.A.trim();
          console.log(`Found store address: "${storeAddress}"`);
        }
      }
      
      // Look for phone and email
      if (rowString && rowString.includes('Phone :') && rowString.includes('E-Mail :')) {
        const phoneMatch = rowString.match(/Phone\s*:\s*(\d+)/);
        const emailMatch = rowString.match(/E-Mail\s*:\s*([^\s]+)/);
        
        if (phoneMatch) {
          storePhone = phoneMatch[1];
          console.log(`Found store phone: "${storePhone}"`);
        }
        
        if (emailMatch) {
          storeEmail = emailMatch[1];
          console.log(`Found store email: "${storeEmail}"`);
        }
      }
    }
    
    console.log(`Extracted store information: 
      Name: ${storeName}
      Address: ${storeAddress}
      Phone: ${storePhone}
      Email: ${storeEmail}`);
    
    // If store name is still empty, use default - BUT ONLY AS A FALLBACK
    if (!storeName) {
      storeName = 'WEKEYAR PLUS';
      console.log('Using default store name: WEKEYAR PLUS');
    }
    
    if (!storeAddress) {
      storeAddress = 'AT.PLOT NO.210,DISTRICT CENTRE, PO.CHANDRASEKHARPUR, BHUBANESWAR,ODISHA';
      console.log('Using default store address');
    }
    
    // Extract bill records from the data
    const billRecords = [];
    let currentBill = null;
    let currentCustomer = null;
    let lastValidDate = new Date(); // Default date
    
    // Helper function to check if a row contains a customer header
    function isCustomerHeader(row) {
      // Check for numeric values at the start of any field
      for (const key in row) {
        const value = String(row[key] || "");
        // Look for patterns like "9861502588 A K SEN" or similar phone number patterns
        if (/^\d{9,10}\s+\w/.test(value)) {
          return true;
        }
      }
      return false;
    }
    
    // Helper function to check if a row is a date row (follows customer header)
    function isDateRow(row) {
      // Look for date pattern DD-MM-YYYY in any field
      for (const key in row) {
        const value = String(row[key] || "");
        if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
          return true;
        }
      }
      return false;
    }
    
    // Helper function to extract customer phone and name
    function extractCustomerInfo(row) {
      for (const key in row) {
        const value = String(row[key] || "");
        // Match phone number pattern followed by customer name
        const match = value.match(/^(\d+)\s+(.+)$/);
        if (match) {
          return {
            phone: match[1],
            customerName: match[2].trim()
          };
        }
      }
      return { phone: "unknown", customerName: "Unknown" };
    }
    
    // Helper function to extract date
    function extractDate(row) {
      for (const key in row) {
        const value = String(row[key] || "");
        // Match date pattern DD-MM-YYYY
        if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
          const [day, month, year] = value.split("-");
          const date = new Date(`${year}-${month}-${day}`);
          lastValidDate = date; // Store the last valid date
          return date;
        }
      }
      return lastValidDate; // Return the last valid date if no date found
    }
    
    // Helper to check if a row contains bill number (CS/XXXXX or CN/XXXXX)
    function isBillNumberRow(row) {
      for (const key in row) {
        const value = String(row[key] || "");
        // Look for patterns like "CS/35866" or "CN/12345"
        if (/^(CS\/\d+|CN\d+)$/.test(value)) {
          return true;
        }
      }
      return false;
    }
    
    // Helper to extract bill number
    function extractBillNumber(row) {
      for (const key in row) {
        const value = String(row[key] || "");
        // Extract bill number pattern like "CS/35866" or "CN/12345"
        if (/^(CS\/\d+|CN\d+)$/.test(value)) {
          return value;
        }
      }
      return null;
    }
    
    // Helper to check if a row is an item row
    function isItemRow(row) {
      let hasQuantity = false;
      let hasDescription = false;
      let hasBatch = false;
      
      for (const key in row) {
        const value = String(row[key] || "");
        
        // Check for quantity (often 1.0, 2.0, etc.)
        if (/^\d+\.0$/.test(value)) {
          hasQuantity = true;
        }
        
        // Check for batch codes (match patterns in your image)
        if (/^\d+\/\d+\s+\w+/.test(value)) {
          hasBatch = true;
        }
        
        // Description usually has uppercase letters and various medicine names
        if (value.length > 5 && /[A-Z\-]/.test(value) && !/^\d/.test(value)) {
          hasDescription = true;
        }
      }
      
      // We consider it an item row if it has at least a description and either quantity or batch
      return hasDescription && (hasQuantity || hasBatch);
    }
    
    // Helper to extract item details
    function extractItemDetails(row) {
      let name = "";
      let quantity = 1;
      let batch = "";
      let mrp = 0;
      
      for (const key in row) {
        const value = String(row[key] || "");
        
        // Find description (medicine name)
        if (value.length > 5 && /[A-Z\-]/.test(value) && !/^\d/.test(value)) {
          name = value;
        }
        
        // Find quantity
        if (/^\d+\.0$/.test(value)) {
          quantity = parseFloat(value);
        }
        
        // Find batch code
        if (/^\d+\/\d+\s+\w+/.test(value)) {
          batch = value;
        }
        
        // Find price (MRP) - usually a numeric value
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue > 10) { // Assuming prices are greater than 10
          mrp = numValue;
        }
      }
      
      return { name, quantity, batch, expBatch: batch, mrp };
    }
    
    // Helper to check if a row contains bill total information
    function isBillTotal(row) {
      for (const key in row) {
        const value = String(row[key] || "");
        // Look for "TOTAL AMOUNT :" pattern
        if (value.includes("TOTAL AMOUNT")) {
          return true;
        }
      }
      return false;
    }
    
    // Helper to extract total amount
    function extractTotalAmount(row) {
      let totalAmount = 0;
      
      // First check if there's a column with "TOTAL AMOUNT :"
      for (const key in row) {
        const value = String(row[key] || "");
        
        if (value.includes("TOTAL AMOUNT")) {
          // Look for the number in the same row
          for (const amountKey in row) {
            // Skip if the key itself contains "TOTAL AMOUNT"
            if (String(amountKey).includes("TOTAL AMOUNT")) continue;
            
            const amountValue = row[amountKey];
            if (amountValue && !isNaN(parseFloat(amountValue))) {
              const numValue = parseFloat(amountValue);
              if (numValue > 0) {
                totalAmount = numValue;
                break;
              }
            }
          }
        }
      }
      
      // If we didn't find a total using the column method, try to find it directly
      if (totalAmount === 0) {
        // In your image, the total amount appears to be in a specific column
        for (const key in row) {
          if (key === 'C' || key === 'D') { // Column might be between QTY and CASH
            const value = row[key];
            if (value && !isNaN(parseFloat(value))) {
              totalAmount = parseFloat(value);
            }
          }
        }
      }
      
      console.log(`Extracted total amount: ${totalAmount}`);
      return totalAmount;
    }

    // Helper to extract cash and credit amounts directly from the row
    function extractCashAndCredit(row, billNo) {
      let cash = 0;
      let credit = 0;
      
      // First check if this is a row that actually contains the bill number
      let isBillRow = false;
      for (const key in row) {
        if (String(row[key]) === billNo) {
          isBillRow = true;
          break;
        }
      }
      
      // If this is the specific bill's row, extract cash and credit from corresponding columns
      if (isBillRow) {
        const columns = Object.keys(row);
        // In your image, CASH is typically the second-to-last column
        // and CREDIT is the last column
        if (columns.length >= 2) {
          const cashColumn = columns[columns.length - 2];
          const creditColumn = columns[columns.length - 1];
          
          if (row[cashColumn] && !isNaN(parseFloat(row[cashColumn]))) {
            cash = parseFloat(row[cashColumn]);
          }
          
          if (row[creditColumn] && !isNaN(parseFloat(row[creditColumn]))) {
            credit = parseFloat(row[creditColumn]);
            // Handle negative credit values
            if (credit < 0) {
              credit = Math.abs(credit);
            }
          }
        }
      }
      
      console.log(`For bill ${billNo}: Cash=${cash}, Credit=${credit}`);
      return { cash, credit };
    }
    
    // Main processing loop
    let currentCustomerBills = []; // Track bills for the current customer
    let lastProgressUpdate = 0; // Track the last progress percentage sent
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      console.log("Processing row:", JSON.stringify(row));
      
      // Check for customer header - start a new customer
      if (isCustomerHeader(row)) {
        // Save any previous customer's bills
        if (currentCustomerBills.length > 0) {
          billRecords.push(...currentCustomerBills);
          currentCustomerBills = [];
        }
        
        // Extract customer info
        const customerInfo = extractCustomerInfo(row);
        
        // Check if next row contains the date
        let date = lastValidDate; // Default to the last valid date
        if (i + 1 < data.length && isDateRow(data[i + 1])) {
          date = extractDate(data[i + 1]);
          i++; // Skip the date row in next iteration
        }
        
        currentCustomer = {
          phone: customerInfo.phone,
          name: customerInfo.customerName,
          date: date
        };
        
        console.log(`Created new customer record: ${customerInfo.customerName} with phone ${customerInfo.phone}`);
      }
      // Check for bill number row - start a new bill but keep the same customer
      else if (currentCustomer && isBillNumberRow(row)) {
        const billNo = extractBillNumber(row);
        
        // Create a new bill with the same customer info
        const newBill = {
          billNo: billNo,
          customerPhone: currentCustomer.phone,
          customerName: currentCustomer.name,
          date: currentCustomer.date,
          items: [],
          totalAmount: 0,
          cash: 0,
          credit: 0
        };
        
        // Extract cash and credit specifically for this bill number
        const payments = extractCashAndCredit(row, billNo);
        newBill.cash = payments.cash;
        newBill.credit = payments.credit;
        
        currentCustomerBills.push(newBill);
        currentBill = newBill; // Set this as the current bill for adding items
        
        console.log(`Created new bill: ${billNo} with Cash=${newBill.cash}, Credit=${newBill.credit}`);
      }
      // Check for item rows
      else if (currentBill && isItemRow(row)) {
        const item = extractItemDetails(row);
        
        // Add item to current bill
        currentBill.items.push(item);
        
        console.log(`Added item to bill ${currentBill.billNo}: ${item.name}`);
      }
      // Check for bill total - this might be for a specific bill within the customer section
      else if (currentCustomerBills.length > 0 && isBillTotal(row)) {
        // Try to determine which bill this total belongs to
        let billIndex = -1;
        let billNo = null;
        
        // First check if the row contains a bill number
        for (const key in row) {
          const value = String(row[key] || "");
          if (/^(CS\/\d+|CN\d+)$/.test(value)) {
            billNo = value;
            break;
          }
        }
        
        // If we found a bill number, find the matching bill
        if (billNo) {
          billIndex = currentCustomerBills.findIndex(bill => bill.billNo === billNo);
        } else {
          // If no bill number in this row, it might be a summary row for the current bill
          billIndex = currentCustomerBills.length - 1; // Default to the last bill
        }
        
        // If we found a matching bill, update its total
        if (billIndex >= 0) {
          const totalAmount = extractTotalAmount(row);
          currentCustomerBills[billIndex].totalAmount = totalAmount;
          
          // If we don't have payment information yet, try to extract it here
          if (currentCustomerBills[billIndex].cash === 0 && currentCustomerBills[billIndex].credit === 0) {
            // Try to find payment information in nearby rows
            for (let j = Math.max(0, i-3); j <= Math.min(data.length-1, i+3); j++) {
              const nearbyRow = data[j];
              
              // Check if this row contains the bill number
              let containsBillNo = false;
              for (const key in nearbyRow) {
                if (String(nearbyRow[key]) === currentCustomerBills[billIndex].billNo) {
                  containsBillNo = true;
                  break;
                }
              }
              
              if (containsBillNo) {
                // Extract payments from this row
                const payments = extractCashAndCredit(nearbyRow, currentCustomerBills[billIndex].billNo);
                if (payments.cash > 0 || payments.credit !== 0) {
                  currentCustomerBills[billIndex].cash = payments.cash;
                  currentCustomerBills[billIndex].credit = payments.credit;
                  console.log(`Found payment info for bill ${currentCustomerBills[billIndex].billNo}: Cash=${payments.cash}, Credit=${payments.credit}`);
                  break;
                }
              }
            }
          }
          
          console.log(`Set total amount for bill ${currentCustomerBills[billIndex].billNo}: ${totalAmount}`);
        }
      }
      // Special handling for tables with multiple bills
      else if (row && currentCustomerBills.length > 0) {
        // Check if this row contains a bill number and payment information
        let billNo = null;
        for (const key in row) {
          const value = String(row[key] || "");
          if (/^(CS|CN)\/\d+$/.test(value)) {
            billNo = value;
            break;
          }
        }
        
        if (billNo) {
          // Find the matching bill
          const billIndex = currentCustomerBills.findIndex(bill => bill.billNo === billNo);
          
          if (billIndex >= 0) {
            // Extract payment information for this specific bill
            const columns = Object.keys(row);
            if (columns.length >= 2) {
              const cashColumn = columns[columns.length - 2];
              const creditColumn = columns[columns.length - 1];
              
              if (row[cashColumn] && !isNaN(parseFloat(row[cashColumn]))) {
                currentCustomerBills[billIndex].cash = parseFloat(row[cashColumn]);
              }
              
              if (row[creditColumn] && !isNaN(parseFloat(row[creditColumn]))) {
                let creditValue = parseFloat(row[creditColumn]);
                currentCustomerBills[billIndex].credit = creditValue < 0 ? Math.abs(creditValue) : creditValue;
              }
              
              console.log(`Updated payment info for bill ${billNo}: Cash=${currentCustomerBills[billIndex].cash}, Credit=${currentCustomerBills[billIndex].credit}`);
            }
          }
        }
      }
      
      processedRows++;
      // Update progress more frequently - calculate percentage with decimal precision
      const currentProgress = (processedRows / totalRows) * 100;
      if (currentProgress - lastProgressUpdate >= 0.1 || i === data.length - 1) {
        console.log(`Progress: ${currentProgress.toFixed(1)}%`); // Debug log
        parentPort.postMessage({
          status: 'progress',
          progress: parseFloat(currentProgress.toFixed(1))
        });
        lastProgressUpdate = currentProgress;
      }
    }
    
    // Add the remaining bills
    if (currentCustomerBills.length > 0) {
      billRecords.push(...currentCustomerBills);
    }
    
    // Before saving to the database, make sure all bills have their payment information
    for (const bill of billRecords) {
      // If a bill has zero for both cash and credit but has a total amount,
      // check other bills in the same customer record for payment info
      if (bill.cash === 0 && bill.credit === 0 && bill.totalAmount > 0) {
        console.log(`Bill ${bill.billNo} is missing payment information. Attempting to recover.`);
        
        // Check if there's any row in the data that can help
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          
          // Skip rows that don't mention this bill
          let containsBillNo = false;
          for (const key in row) {
            if (String(row[key]) === bill.billNo) {
              containsBillNo = true;
              break;
            }
          }
          
          if (containsBillNo) {
            // Look at the last two columns which are typically CASH and CREDIT
            const columns = Object.keys(row);
            if (columns.length >= 2) {
              const cashColumn = columns[columns.length - 2];
              const creditColumn = columns[columns.length - 1];
              
              if (row[cashColumn] && !isNaN(parseFloat(row[cashColumn]))) {
                bill.cash = parseFloat(row[cashColumn]);
              }
              
              if (row[creditColumn] && !isNaN(parseFloat(row[creditColumn]))) {
                let creditValue = parseFloat(row[creditColumn]);
                bill.credit = creditValue < 0 ? Math.abs(creditValue) : creditValue;
              }
              
              console.log(`Recovered payment info for bill ${bill.billNo}: Cash=${bill.cash}, Credit=${bill.credit}`);
              break;
            }
          }
        }
        
        // If still no payment info, as a fallback, assume cash payment equal to total
        if (bill.cash === 0 && bill.credit === 0) {
          bill.cash = bill.totalAmount;
          console.log(`Defaulted bill ${bill.billNo} to cash payment of ${bill.totalAmount}`);
        }
      }
    }
    
    console.log(`Extracted ${billRecords.length} bill records`);
    
    // Process batch by batch to insert into the database
    for (const bill of billRecords) {
      try {
        // Skip bills without a bill number
        if (!bill.billNo) {
          console.log(`Skipping bill without bill number for customer ${bill.customerName}`);
          continue;
        }
    
        // Get or create customer
        let customerId = customerMap.get(bill.customerPhone);
        if (!customerId) {
          const customer = await prisma.customer.upsert({
            where: { phone: bill.customerPhone },
            update: { name: bill.customerName },
            create: {
              name: bill.customerName,
              phone: bill.customerPhone,
              address: null,
            },
          });
    
          customerId = customer.id;
          customerMap.set(bill.customerPhone, customerId);
          console.log(`Created/found customer ${bill.customerName} with ID ${customerId}`);
        }
    
        // Get or create store
        let storeId = storeMap.get(storeName);
        if (!storeId) {
          const store = await prisma.store.upsert({
            where: { storeName: storeName },
            update: {
              address: storeAddress,
              phone: storePhone,
              email: storeEmail
            },
            create: {
              storeName: storeName,
              address: storeAddress,
              phone: storePhone,
              email: storeEmail
            },
          });
    
          storeId = store.id;
          storeMap.set(storeName, storeId);
          console.log(`Created/found store ${storeName} with ID ${storeId}`);
        }
    
        // Check if bill already exists to avoid duplicates
        const existingBill = await prisma.bill.findUnique({
          where: { billNo: bill.billNo },
        });
    
        if (existingBill) {
          console.log(`Bill ${bill.billNo} already exists, skipping`);
          billMap.set(bill.billNo, existingBill.id);
          continue; // Skip to next bill
        }
    
        // Use the actual values from the bill
        const netAmount = bill.totalAmount; // Total amount of the bill
        const amountPaid = bill.cash; // Cash value
        const creditAmount = bill.credit; // Credit value
    
        // Create bill and its details in a transaction
        const result = await prisma.$transaction(async (tx) => {
          const newBill = await tx.bill.create({
            data: {
              billNo: bill.billNo,
              customerId: customerId,
              storeId: storeId,
              date: bill.date,
              netDiscount: 0,
              netAmount: netAmount,
              amountPaid: amountPaid,
              creditAmount: creditAmount,
              paymentType: creditAmount > 0 ? 'CREDIT' : 'CASH',
              isUploaded: true,
            },
          });
    
          console.log(`Created bill ${bill.billNo} with ID ${newBill.id}`);
    
          // Create bill details
          for (const item of bill.items) {
            // Calculate the MRP per item if no specific MRP is found
            let itemMrp = item.mrp;
            if (itemMrp === 0 && bill.items.length > 0) {
              itemMrp = netAmount / bill.items.length; // Simple average if no specific MRP
            }
            
            const billDetail = await tx.billDetails.create({
              data: {
                billId: newBill.id,
                item: item.name,
                quantity: item.quantity,
                batch: item.batch || '',
                expBatch: item.expBatch || '',
                mrp: itemMrp,
                discount: 0,
              },
            });
    
            console.log(`Created bill detail for ${item.name} with ID ${billDetail.id}`);
            totalItems++;
          }
    
          return newBill;
        });
    
        billMap.set(bill.billNo, result.id);
        totalBills++;
    
        console.log(`Successfully processed bill ${bill.billNo}`);
      } catch (error) {
        console.error(`Error processing bill ${bill.billNo}:`, error);
      }
    }
    
    console.log('Completed processing all bills');
    
    parentPort.postMessage({
      status: 'completed',
      stats: {
        totalProcessed: processedRows,
        billsExtracted: billRecords.length,
        billsCreated: totalBills,
        itemsCreated: totalItems
      }
    });
    
    // Clean up
    await prisma.$disconnect();
  } catch (error) {
    console.error('Worker error:', error);
    parentPort.postMessage({ 
      status: 'error', 
      error: error.message 
    });
    
    await prisma.$disconnect();
  }
}

processExcelFile();