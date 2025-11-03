const { workerData, parentPort } = require("worker_threads");
const ExcelJS = require("exceljs");
const { PrismaClient } = require("@prisma/client");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const stream = require("stream");
const { promisify } = require("util");
const pipeline = promisify(stream.pipeline);

// Create a Prisma client with correct configuration
const prisma = new PrismaClient({
  log: ["error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Reduced batch size to prevent connection pool exhaustion
const BATCH_SIZE = 50;

const BILL_PREFIXES = ["CSP", "DUM", "GGP", "IRC", "KV", "MM", "RUCH", "SAM", "SUM", "VSS", "CS", "CN"];
const BILL_REGEX = new RegExp(`^(${BILL_PREFIXES.join("|")}|[A-Z])(\\/)?\\d+`, "i");

const KNOWN_STORES = [
  "RUCHIKA",
  //"WEKEYAR PLUS",
  //"MAUSIMAA SQUARE",
  "MOUSIMAA",
  "DUMDUMA",
  "SUM HOSPITAL",
  "SAMANTARAPUR",
  "GGP COLONY",
  "CHANDRASEKHARPUR",
  "KALINGA VIHAR",
  "VSS NAGAR",
  "IRC VILLAGE"
];

const STORE_REGEX = new RegExp(KNOWN_STORES.map(store =>
  store.replace(/\s+/g, '\\s+') // Handle flexible spacing
).join('|'), 'i'); // Case insensitive

// Helper function to execute operations with retry logic
async function executeWithRetry(operation, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (
        (error.message.includes("connection pool") ||
          error.message.includes("timed out")) &&
        attempt < maxRetries
      ) {
        console.log(`Retrying operation, attempt ${attempt}/${maxRetries}`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        lastError = error;
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

async function processExcelFile() {
  const DEFAULT_PHONE = "9999999999";
  const DEFAULT_NAME = "Cashlist Customer";

  let currentProgress = 0;
  try {
    const { fileUrl } = workerData;
    console.log(`Downloading file from Cloudinary: ${fileUrl}`);

    // Download file using streaming to reduce memory usage

    // Download file using streaming with retry logic
    const response = await executeWithRetry(async () => {
      return axios({
        method: "get",
        url: fileUrl,
        responseType: "stream",
      });
    });

    console.log("File downloaded successfully.");

    // Track progress
    const startTime = Date.now();
    const storeMap = new Map();
    const customerMap = new Map();
    let billMap = new Map();
    let totalBills = 0;
    let totalItems = 0;

    // Store information - we'll extract this from the first few rows
    let storeInfo = {
      name: "",
      address: "",
      phone: "",
      email: "",
    };

    // Initialize processing state
    let lastValidDate = new Date();
    let currentCustomer = {
      phone: DEFAULT_PHONE,
      name: DEFAULT_NAME,
      date: lastValidDate,
      isCashlist: true,
    };
    let currentBill = null;
    let currentCustomerBills = [];
    let billRecords = [];
    let rowCount = 0;
    let processedRows = 0;
    let lastProgressUpdate = 0;

    // Create an ExcelJS workbook and stream rows from the file
    const workbook = new ExcelJS.Workbook();
    console.time("Excel parsing");

    await workbook.xlsx.read(response.data);
    console.log("File downloaded and loaded into memory.");
    const worksheet = workbook.getWorksheet(1); // Get the first worksheet
    rowCount = worksheet.rowCount;

    console.timeEnd("Excel parsing");
    console.log(`Found ${rowCount} rows in Excel file`);

    // Extract store information from the first few rows
    // Extract store information from the first few rows
    for (let i = 1; i <= Math.min(10, rowCount); i++) {
      const row = worksheet.getRow(i);
      const rowValueArray = [];

      row.eachCell((cell) => {
        rowValueArray.push(cell.value ? String(cell.value).trim() : "");
      });

      const rowString = rowValueArray.join(" ");

      const STORE_NAME_MAPPINGS = {
        'IRC VILAGE': 'IRC VILLAGE',
        'MAUSIMAA SQUARE': 'MOUSIMAA',    // Add this mapping
        'MAUSIMAA': 'MOUSIMAA'
        // Add more mappings if needed
      };

      // Look for store name in the address line (usually line 2, with "PLOT NO")
      if (!storeInfo.name) {
        // Try to find a matching store name in the line
        for (const store of KNOWN_STORES) {
          if (rowString.toUpperCase().includes(store.toUpperCase())) {
            storeInfo.name = store;
            break;
          }
        }

        if (!storeInfo.name) {
          const normalizedRowString = rowString.toUpperCase().trim();
          for (const [variant, correctName] of Object.entries(STORE_NAME_MAPPINGS)) {
            if (normalizedRowString.includes(variant.toUpperCase())) {
              storeInfo.name = correctName;
              break;
            }
          }
        }
        // Store the address regardless
        if (rowValueArray[0]) {
          storeInfo.address = rowValueArray[0].trim();
        }
      }

      // Look for phone and email (same as before)
      if (
        rowString &&
        rowString.includes("Phone :") &&
        rowString.includes("E-Mail :")
      ) {
        const phoneMatch = rowString.match(/Phone\s*:\s*(\d+)/);
        const emailMatch = rowString.match(/E-Mail\s*:\s*([^\s]+)/);

        if (phoneMatch) storeInfo.phone = phoneMatch[1];
        if (emailMatch) storeInfo.email = emailMatch[1];
      }
    }

    // If no store name found, fallback to UNKNOWN
    if (!storeInfo.name) {
      console.warn("⚠️ Could not determine store name from header rows!");
      storeInfo.name = "UNKNOWN STORE";
    }

    console.log("📍 Detected store:", {
      name: storeInfo.name,
      address: storeInfo.address,
      phone: storeInfo.phone,
      email: storeInfo.email
    });

    console.log(`Extracted store information: ${JSON.stringify(storeInfo)}`);

    // Use more efficient data structure for row processing (array instead of objects)
    const sheetRows = [];

    // Fast pass to convert to memory-efficient array structure
    worksheet.eachRow((row, rowNumber) => {
      const rowArray = [];
      row.eachCell((cell) => {
        rowArray.push(cell.value);
      });
      sheetRows.push(rowArray);
    });

    // Helper functions for row classification using arrays
    function isCustomerHeader(rowArray) {
      // This function should ONLY identify the main customer headers at the top of sections
      // (like "9437493311 AJAY KUMAR" in your images)

      // Only consider it a customer header if:
      // 1. It's just a 10-digit phone number followed by a name
      // 2. It's in the first column (appears to be the pattern in your Excel)
      // 3. There's no bill number (CS/xxxxx) in this row

      if (!rowArray[0]) return false;

      const firstCellValue = String(rowArray[0]).trim();

      // Check for exact pattern: 10 digits followed by name
      const isValidCustomerPattern = /^\d{10}\s+[A-Z\s]+$/.test(firstCellValue);

      // Make sure there's no bill number in this row
      const hasBillNumber = rowArray.some((value) => {
        if (!value) return false;
        const strValue = String(value).trim();
        return BILL_REGEX.test(strValue);
      });

      return isValidCustomerPattern && !hasBillNumber;
    }

    function isDateRow(rowArray) {
      return rowArray.some((value) => {
        if (!value) return false;
        const strValue = String(value).trim();
        return /^\d{2}-\d{2}-\d{4}$/.test(strValue);
      });
    }

    function extractCustomerInfo(rowArray) {
      for (const value of rowArray) {
        if (!value) continue;
        const strValue = String(value).trim();
        const match = strValue.match(/^(\d+)\s+(.+)$/);
        if (match) {
          return {
            phone: match[1],
            customerName: match[2].trim(),
            isCashlist: false,
          };
        }
      }
      return {
        phone: DEFAULT_PHONE,
        customerName: DEFAULT_NAME,
        isCashlist: true,
      };
    }

    function extractDate(rowArray) {
      for (const value of rowArray) {
        if (!value) continue;
        const strValue = String(value).trim();
        // Improved regex to match DD-MM-YYYY format
        const dateMatch = strValue.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (dateMatch) {
          const [, day, month, year] = dateMatch;
          const date = new Date(`${year}-${month}-${day}`);
          return date;
        }
      }
      return lastValidDate;
    }

    function isBillNumberRow(rowArray) {
      return rowArray.some((value) => {
        if (!value) return false;
        const strValue = String(value).trim();
        return BILL_REGEX.test(strValue);
      });
    }

    function extractBillNumberAndFirstItem(rowArray) {
      for (let idx = 0; idx < rowArray.length; idx++) {
        const value = rowArray[idx];
        if (!value) continue;
        let strValue = String(value).trim();

        // Remove any trailing '- Mobile -' or similar text
        strValue = strValue.replace(/\-+\s*Mobile\s*\-+/i, '').trim();

        const match = strValue.match(BILL_REGEX);
        if (match) {
          const billNo = match[0];

          // Remove billNo and clean up the remaining text
          let rest = strValue
            .replace(billNo, '')
            .replace(/LN\s+\d+/i, '')        // Remove "LN 99" pattern
            .replace(/DR\s+[A-Z\s]+/i, '')   // Remove "DR S JAMUDA" pattern
            .replace(/\d{10,}/g, '')         // Remove long numeric IDs (10+ digits) like doctor registration numbers
            .replace(/[A-Z]+\s+\d+/i, '')    // Remove other code patterns
            .replace(/\s+\d{1,3}$/i, '')     // Remove trailing 1-3 digit numbers like " 99"
            .trim();

          // Clone rowArray and replace this cell with empty string (no items on bill number row)
          const firstItemRowArray = [...rowArray];
          firstItemRowArray[idx] = '';  // Clear the cell to avoid parsing extra text as items

          return { billNo, firstItemRowArray };
        }
      }
      return null;
    }


    function isItemRow(rowArray) {
      let hasQuantity = false;
      let hasDescription = false;
      let hasBatch = false;

      for (const value of rowArray) {
        if (!value) continue;
        const strValue = String(value).trim();

        if (/^\d+\.0$/.test(strValue)) {
          hasQuantity = true;
        }

        if (/^\d+\/\d+\s+\w+/.test(strValue)) {
          hasBatch = true;
        }

        if (
          strValue.length > 5 &&
          /[A-Z\-]/.test(strValue) &&
          !/^\d/.test(strValue)
        ) {
          hasDescription = true;
        }
      }

      return hasDescription && (hasQuantity || hasBatch);
    }

    function extractItemDetails(rowArray) {
      let name = "";
      let quantity = 1;
      let batch = "";
      let mrp = 0;

      // Look for quantity in the correct column (appears to be column 3 in your spreadsheet)
      if (rowArray[2] && !isNaN(parseFloat(rowArray[2]))) {
        quantity = parseInt(parseFloat(rowArray[2]));
      }

      for (const value of rowArray) {
        if (!value) continue;
        const strValue = String(value).trim();

        if (
          strValue.length > 5 &&
          /[A-Z\-]/.test(strValue) &&
          !/^\d/.test(strValue)
        ) {
          name = strValue;
        }

        // Improved quantity parsing - needs to look in the correct column
        // This approach may need to be adjusted based on the exact structure
        if (/^\d+\.?\d*$/.test(strValue) && parseInt(strValue) < 100) {
          quantity = parseInt(parseFloat(strValue));
        }

        if (/^\d+\/\d+\s+\w+/.test(strValue)) {
          batch = strValue;
        }

        const numValue = parseFloat(strValue);
        if (!isNaN(numValue) && numValue > 10) {
          mrp = numValue;
        }
      }

      return { name, quantity, batch, expBatch: batch, mrp };
    }

    function isBillTotal(rowArray) {
      return rowArray.some((value) => {
        if (!value) return false;
        const strValue = String(value).trim();
        return strValue.includes("TOTAL AMOUNT");
      });
    }

    function extractTotalAmount(rowArray) {
      let totalAmount = 0;

      for (let i = 0; i < rowArray.length; i++) {
        const value = rowArray[i];
        if (!value) continue;

        const strValue = String(value).trim();
        if (strValue.includes("TOTAL AMOUNT")) {
          // Check adjacent cells for the amount
          for (let j = i + 1; j < Math.min(rowArray.length, i + 3); j++) {
            const amountValue = rowArray[j];
            if (amountValue && !isNaN(parseFloat(amountValue))) {
              return parseFloat(amountValue);
            }
          }
        }
      }

      // If we didn't find the total with "TOTAL AMOUNT" label, look for numbers in columns C-D
      if (rowArray[2] && !isNaN(parseFloat(rowArray[2]))) {
        totalAmount = parseFloat(rowArray[2]);
      } else if (rowArray[3] && !isNaN(parseFloat(rowArray[3]))) {
        totalAmount = parseFloat(rowArray[3]);
      }

      return totalAmount;
    }

    function extractCashAndCredit(rowArray, billNo) {
      let cash = 0;
      let credit = 0;

      // Find the bill number index
      const billIndex = rowArray.findIndex(cell =>
        cell && String(cell).includes(billNo)
      );

      if (billIndex >= 0) {
        // Find the first numeric cell after the bill number (ignore description columns)
        for (let i = billIndex + 1; i < rowArray.length; i++) {
          const value = rowArray[i];
          if (!value) continue;
          const strValue = String(value).trim();

          // Only consider if the cell is just a number (no other text)
          if (!/^-?\d+(\.\d+)?$/.test(strValue)) continue;

          // Skip phone numbers (10 digits) and long IDs
          if (/^\d{10,}$/.test(strValue)) continue;

          // Skip if cell contains doctor/person name pattern
          const cellValue = strValue.toUpperCase();
          if (cellValue.includes('DR.') || cellValue.includes('DR ') ||
            /\d+\s+[A-Z]{2,}\s+[A-Z]/.test(cellValue)) continue;

          const amount = parseFloat(strValue);
          if (amount < 0) {
            credit += Math.abs(amount);
          } else if (amount > 0) {
            cash += amount;
          }
          break; // Only take the first numeric cell after bill number
        }
      }

      // Second pass: If no amounts found yet, check the bill number cell itself (unchanged)
      if (cash === 0 && billIndex >= 0) {
        const billCell = String(rowArray[billIndex]);
        const amountMatch = billCell.match(/\s+([\d.\-]+)/);
        if (amountMatch) {
          const amount = parseFloat(amountMatch[1]);
          if (billCell.toUpperCase().includes('DR.') ||
            billCell.toUpperCase().includes('DR ') ||
            /\d+\s+[A-Z]{2,}\s+[A-Z]/.test(billCell)) {
            // Don't process this amount
          } else if (Math.abs(amount) <= 1000000) {
            if (amount < 0) {
              credit += Math.abs(amount);
            } else if (amount > 0) {
              cash += amount;
            }
          }
        }
      }

      // Third pass: Look for amounts in a nearby "TOTAL AMOUNT" row (unchanged)
      if (cash === 0) {
        const totalAmountIdx = rowArray.findIndex(cell =>
          cell && String(cell).includes('TOTAL AMOUNT')
        );

        if (totalAmountIdx >= 0) {
          for (let i = totalAmountIdx + 1; i < rowArray.length; i++) {
            const value = rowArray[i];
            if (!value || isNaN(parseFloat(value))) continue;

            const amount = parseFloat(value);
            const strValue = String(value).trim();

            // Skip long numeric IDs
            if (/^\d{10,}$/.test(strValue)) {
              continue;
            }

            // Skip if followed by doctor/person name
            const cellValue = String(rowArray[i]).toUpperCase();
            if (cellValue.includes('DR.') || cellValue.includes('DR ') ||
              /\d+\s+[A-Z]{2,}\s+[A-Z]/.test(cellValue)) {
              continue;
            }

            if (amount < 0) {
              credit += Math.abs(amount);
            } else if (amount > 0) {
              cash += amount;
            }
          }
        }
      }

      return { cash, credit };
    }

    // Process all rows with optimized loop
    console.time("Row processing");
    for (let i = 0; i < sheetRows.length; i++) {
      const rowArray = sheetRows[i];

      // Customer header row
      if (isCustomerHeader(rowArray)) {
        // Save previous customer's bills
        if (currentCustomerBills.length > 0) {
          billRecords.push(...currentCustomerBills);
          currentCustomerBills = [];
        }

        const customerInfo = extractCustomerInfo(rowArray);

        // Check if next row contains the date
        let date = lastValidDate;
        if (i + 1 < sheetRows.length && isDateRow(sheetRows[i + 1])) {
          date = extractDate(sheetRows[i + 1]);
          i++; // Skip date row
        }

        currentCustomer = {
          phone: customerInfo.phone,
          name: customerInfo.customerName,
          date: date,
        };
      }
      // Bill number row
      // ...existing code...
      else if (currentCustomer && isBillNumberRow(rowArray)) {
        const billInfo = extractBillNumberAndFirstItem(rowArray);
        if (!billInfo) continue;
        const { billNo, firstItemRowArray } = billInfo;
        let billDate = lastValidDate;
        for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
          if (isDateRow(sheetRows[j])) {
            billDate = extractDate(sheetRows[j]);
            lastValidDate = billDate;
            break;
          }
        }
        const newBill = {
          billNo: billNo,
          customerPhone: currentCustomer.phone,
          customerName: currentCustomer.name,
          date: billDate,
          items: [],
          totalAmount: 0,
          cash: 0,
          credit: 0,
        };
        const payments = extractCashAndCredit(rowArray, billNo);
        newBill.cash = payments.cash;
        newBill.credit = payments.credit;
        // If the cell had both billNo and item, extract the first item
        const firstItem = extractItemDetails(firstItemRowArray);
        if (firstItem && firstItem.name) {
          newBill.items.push(firstItem);
        }
        currentCustomerBills.push(newBill);
        currentBill = newBill;
      }
      // ...existing code...
      // Item row
      else if (currentBill && isItemRow(rowArray)) {
        const item = extractItemDetails(rowArray);
        currentBill.items.push(item);
      }
      // Bill total row
      else if (currentCustomerBills.length > 0 && isBillTotal(rowArray)) {
        // Try to determine which bill this total belongs to
        let billIndex = -1;
        let billNo = null;

        for (const value of rowArray) {
          if (!value) continue;
          const strValue = String(value).trim();
          if (BILL_REGEX.test(strValue)) {
            billNo = strValue;
            break;
          }
        }

        if (billNo) {
          billIndex = currentCustomerBills.findIndex(
            (bill) => bill.billNo === billNo
          );
        } else {
          billIndex = currentCustomerBills.length - 1;
        }

        if (billIndex >= 0) {
          const totalAmount = extractTotalAmount(rowArray);
          currentCustomerBills[billIndex].totalAmount = totalAmount;

          // Try to get payment info if not already available
          if (
            currentCustomerBills[billIndex].cash === 0 &&
            currentCustomerBills[billIndex].credit === 0
          ) {
            for (
              let j = Math.max(0, i - 3);
              j <= Math.min(sheetRows.length - 1, i + 3);
              j++
            ) {
              const nearbyRow = sheetRows[j];

              const billNoIndex = nearbyRow.findIndex(
                (value) =>
                  value &&
                  String(value).trim() ===
                  currentCustomerBills[billIndex].billNo
              );

              if (billNoIndex >= 0) {
                const payments = extractCashAndCredit(
                  nearbyRow,
                  currentCustomerBills[billIndex].billNo
                );
                if (payments.cash > 0 || payments.credit !== 0) {
                  currentCustomerBills[billIndex].cash = payments.cash;
                  currentCustomerBills[billIndex].credit = payments.credit;
                  break;
                }
              }
            }
          }
        }
        if (i + 1 < sheetRows.length) {
          const nextRow = sheetRows[i + 1];
          if (!isItemRow(nextRow) && !isBillNumberRow(nextRow)) {
            // This appears to be the end of the current customer section
            // Save the current bills
            billRecords.push(...currentCustomerBills);
            currentCustomerBills = [];

            // Reset the current customer to a cash customer for any bills without a clear owner
            currentCustomer = {
              phone: DEFAULT_PHONE,
              name: DEFAULT_NAME,
              date: lastValidDate,
              isCashlist: true,
            };
          }
        }
      }
      // Special handling for tables with multiple bills
      else if (rowArray && currentCustomerBills.length > 0) {
        let billNo = null;
        for (const value of rowArray) {
          if (!value) continue;
          const strValue = String(value).trim();
          if (BILL_REGEX.test(strValue)) {
            billNo = strValue;
            break;
          }
        }

        if (billNo) {
          const billIndex = currentCustomerBills.findIndex(
            (bill) => bill.billNo === billNo
          );

          if (billIndex >= 0) {
            const payments = extractCashAndCredit(rowArray, billNo);
            if (payments.cash > 0 || payments.credit !== 0) {
              currentCustomerBills[billIndex].cash = payments.cash;
              currentCustomerBills[billIndex].credit = payments.credit;
            }
          }
        }
      }

      processedRows++;
      const currentProgress = (processedRows / rowCount) * 100;
      if (
        currentProgress - lastProgressUpdate >= 1 ||
        i === sheetRows.length - 1
      ) {
        parentPort.postMessage({
          status: "progress",
          progress: parseFloat(currentProgress.toFixed(1)),
        });
        lastProgressUpdate = currentProgress;
      }
    }
    console.timeEnd("Row processing");
    // Broadcast progress to all connected clients

    // Add remaining bills
    if (currentCustomerBills.length > 0) {
      billRecords.push(...currentCustomerBills);
    }

    // Fill in missing payment info and validate bills
    console.log(
      `Processed ${billRecords.length} bills, preparing for database insertionnnn`
    );
    const validBillRecords = billRecords.filter((bill) => {
      // Fill in missing payment info if needed
      if (bill.cash === 0 && bill.credit === 0 && bill.totalAmount > 0) {
        bill.cash = bill.totalAmount; // Default to cash payment
      }

      // Filter out bills without a bill number
      return !!bill.billNo;
    });

    console.log(`Found ${validBillRecords.length} valid bills to insert`);
    //     validBillRecords.forEach((bill, idx) => {
    //     console.log(`Bill #${idx + 1}:`, JSON.stringify(bill, null, 2));
    // });

    // Process store data first
    console.time("Database operations");
    const store = await executeWithRetry(async () => {
      return prisma.store.upsert({
        where: { storeName: storeInfo.name },
        update: {
          address: storeInfo.address,
          phone: storeInfo.phone,
          email: storeInfo.email,
        },
        create: {
          storeName: storeInfo.name,
          address: storeInfo.address,
          phone: storeInfo.phone,
          email: storeInfo.email,
        },
      });
    });

    const storeId = store.id;

    // Process customers in bulk
    const uniqueCustomers = new Map();
    validBillRecords.forEach((bill) => {
      uniqueCustomers.set(bill.customerPhone, bill.customerName);
    });

    // Create all customers at once
    const customerData = Array.from(uniqueCustomers).map(([phone, name]) => ({
      phone,
      name,
      address: null,
      isCashlist: phone === DEFAULT_PHONE,
    }));

    // Create customers in smaller batches
    const customerBatches = [];
    for (let i = 0; i < customerData.length; i += BATCH_SIZE) {
      customerBatches.push(customerData.slice(i, i + BATCH_SIZE));
    }

    for (const batch of customerBatches) {
      // Process customers without transactions (each upsert is atomic anyway)
      for (let i = 0; i < batch.length; i += 10) {
        const subBatch = batch.slice(i, i + 10);

        await executeWithRetry(async () => {
          for (const customer of subBatch) {
            const result = await prisma.customer.upsert({
              where: { phone: customer.phone },
              update: { name: customer.name },
              create: customer,
            });
            customerMap.set(customer.phone, result.id);
          }
        });
      }

      // Give connections time to be released
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Get existing bills to check for updates or skips
    const existingBills = await executeWithRetry(async () => {
      return prisma.bill.findMany({
        where: {
          AND: [
            {
              billNo: {
                in: validBillRecords.map((bill) => bill.billNo),
              },
            },
            {
              storeId: storeId,
            },
          ],
        },
        select: {
          id: true,
          billNo: true,
          storeId: true,
          customerId: true,
          date: true,
          netAmount: true,
          amountPaid: true,
          creditAmount: true,
          billDetails: {
            select: {
              id: true,
              item: true,
              quantity: true,
              batch: true,
              mrp: true,
            }
          }
        },
      });
    });

    // Create a map for quick lookup
    const existingBillsMap = new Map(
      existingBills.map((bill) => {
        const billYear = bill.date ? new Date(bill.date).getFullYear() : null;
        return [`${bill.billNo}-${bill.storeId}-${billYear}`, bill];
      })
    );

    // Separate bills into new and existing
    const billsToCreate = [];
    const billsToUpdate = [];

    for (const bill of validBillRecords) {
      const billYear = new Date(bill.date).getFullYear();  // ADD THIS LINE
      const compositeKey = `${bill.billNo}-${storeId}-${billYear}`;  // UPDATE KEY
      const existingBill = existingBillsMap.get(compositeKey);

      if (!existingBill) {
        billsToCreate.push(bill);
      } else {
        // Bill exists, check if it needs updating
        const customerId = customerMap.get(bill.customerPhone);
        const needsUpdate =
          existingBill.customerId !== customerId ||
          Math.abs(existingBill.netAmount - bill.totalAmount) > 0.01 ||
          Math.abs(existingBill.amountPaid - bill.cash) > 0.01 ||
          Math.abs(existingBill.creditAmount - bill.credit) > 0.01 ||
          new Date(existingBill.date).getTime() !== new Date(bill.date).getTime() ||
          existingBill.billDetails.length !== bill.items.length;

        if (needsUpdate) {
          billsToUpdate.push({ ...bill, existingBillId: existingBill.id });
        }
      }
    }

    console.log(
      `Processing: ${billsToCreate.length} new bills, ${billsToUpdate.length} bills to update, ${existingBills.length - billsToUpdate.length} bills unchanged`
    );

    // Pre-calculate MRP for new bills
    const billsGroupedByNumber = new Map();
    for (const bill of billsToCreate) {
      billsGroupedByNumber.set(bill.billNo, bill);
    }

    // Calculate proper MRP for each bill's items
    for (const bill of billsGroupedByNumber.values()) {
      const totalBillAmount = bill.totalAmount;
      const totalQuantity = bill.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      if (totalQuantity > 0 && totalBillAmount > 0) {
        const mrpPerUnit = totalBillAmount / totalQuantity;
        for (const item of bill.items) {
          if (item.mrp === 0) {
            item.mrp = mrpPerUnit;
          }
        }
      }
    }

    // Pre-calculate MRP for bills to update
    for (const bill of billsToUpdate) {
      const totalBillAmount = bill.totalAmount;
      const totalQuantity = bill.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      if (totalQuantity > 0 && totalBillAmount > 0) {
        const mrpPerUnit = totalBillAmount / totalQuantity;
        for (const item of bill.items) {
          if (item.mrp === 0) {
            item.mrp = mrpPerUnit;
          }
        }
      }
    }

    // Process new bills in batches
    const createBatches = [];
    for (let i = 0; i < billsToCreate.length; i += BATCH_SIZE) {
      createBatches.push(billsToCreate.slice(i, i + BATCH_SIZE));
    }

    let batchCount = 0;
    let billsCreated = 0;

    for (const billBatch of createBatches) {
      batchCount++;
      console.log(`Creating batch ${batchCount} of ${createBatches.length}`);

      for (const bill of billBatch) {
        try {
          const customerId = customerMap.get(bill.customerPhone);
          const billYear = new Date(bill.date).getFullYear();  // ADD THIS LINE

          if (!customerId) {
            console.warn(
              `Missing customer ID for phone ${bill.customerPhone}, skipping bill ${bill.billNo}`
            );
            continue;
          }

          await executeWithRetry(async () => {
            return prisma.$transaction(async (tx) => {
              const newBill = await tx.bill.create({
                data: {
                  billNo: bill.billNo,
                  year: billYear,  // ADD THIS LINE
                  customerId: customerId,
                  storeId: storeId,
                  date: bill.date,
                  netDiscount: 0,
                  netAmount: bill.totalAmount,
                  amountPaid: bill.cash,
                  creditAmount: bill.credit,
                  paymentType: bill.credit > 0 ? "CREDIT" : "CASH",
                  isUploaded: true,
                },
              });

              const billDetails = bill.items.map(item => ({
                billId: newBill.id,
                item: item.name,
                quantity: item.quantity,
                batch: item.batch || "",
                expBatch: item.expBatch || "",
                mrp: item.mrp,
                discount: 0,
              }));

              if (billDetails.length > 0) {
                for (let i = 0; i < billDetails.length; i += 20) {
                  const detailChunk = billDetails.slice(i, i + 20);
                  await tx.billDetails.createMany({
                    data: detailChunk,
                    skipDuplicates: true,
                  });
                }
              }
            });
          });

          billsCreated++;
          totalItems += bill.items.length;
        } catch (error) {
          console.error(`Error creating bill ${bill.billNo}:`, error.message);
        }
      }

      await prisma.$disconnect();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await prisma.$connect();
    }

    // Process bills to update
    const updateBatches = [];
    for (let i = 0; i < billsToUpdate.length; i += BATCH_SIZE) {
      updateBatches.push(billsToUpdate.slice(i, i + BATCH_SIZE));
    }

    let billsUpdated = 0;

    for (const billBatch of updateBatches) {
      batchCount++;
      console.log(`Updating batch ${batchCount}`);

      for (const bill of billBatch) {
        try {
          const customerId = customerMap.get(bill.customerPhone);

          if (!customerId) {
            console.warn(
              `Missing customer ID for phone ${bill.customerPhone}, skipping bill ${bill.billNo}`
            );
            continue;
          }

          await executeWithRetry(async () => {
            return prisma.$transaction(async (tx) => {
              // Update the bill
              await tx.bill.update({
                where: { id: bill.existingBillId },
                data: {
                  customerId: customerId,
                  date: bill.date,
                  netAmount: bill.totalAmount,
                  amountPaid: bill.cash,
                  creditAmount: bill.credit,
                  paymentType: bill.credit > 0 ? "CREDIT" : "CASH",
                  isUploaded: true,
                },
              });

              // Delete old bill details
              await tx.billDetails.deleteMany({
                where: { billId: bill.existingBillId },
              });

              // Create new bill details
              const billDetails = bill.items.map(item => ({
                billId: bill.existingBillId,
                item: item.name,
                quantity: item.quantity,
                batch: item.batch || "",
                expBatch: item.expBatch || "",
                mrp: item.mrp,
                discount: 0,
              }));

              if (billDetails.length > 0) {
                for (let i = 0; i < billDetails.length; i += 20) {
                  const detailChunk = billDetails.slice(i, i + 20);
                  await tx.billDetails.createMany({
                    data: detailChunk,
                    skipDuplicates: true,
                  });
                }
              }
            });
          });

          billsUpdated++;
          totalItems += bill.items.length;
        } catch (error) {
          console.error(`Error updating bill ${bill.billNo}:`, error.message);
        }
      }

      await prisma.$disconnect();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await prisma.$connect();
    }

    totalBills = billsCreated + billsUpdated;

    // Update progress after processing
    parentPort.postMessage({
      status: "progress",
      progress: 95,
    });

    console.timeEnd("Database operations");

    const endTime = Date.now();
    const processingTimeSeconds = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`Processing completed in ${processingTimeSeconds} seconds`);
    console.log(`Bills created: ${billsCreated}, Bills updated: ${billsUpdated}, Items processed: ${totalItems}`);

    parentPort.postMessage({
      status: "completed",
      stats: {
        totalProcessed: processedRows,
        billsExtracted: billRecords.length,
        billsCreated: billsCreated,
        billsUpdated: billsUpdated,
        billsUnchanged: existingBills.length - billsUpdated,
        itemsCreated: totalItems,
        processingTimeSeconds: processingTimeSeconds,
      },
    });

    // Clean up resources
    await prisma.$disconnect();
  } catch (error) {
    console.error("Worker error:", error);
    parentPort.postMessage({
      status: "error",
      error: error.message,
    });

    // Clean up
    try {
      await prisma.$disconnect();
    } catch (cleanupError) {
      console.error("Error during cleanup:", cleanupError);
    }
  }
}

processExcelFile();