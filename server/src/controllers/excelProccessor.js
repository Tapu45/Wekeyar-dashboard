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
const BILL_REGEX = new RegExp(`^(${BILL_PREFIXES.join("|")})\\/\\d+`, "i");

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
          // Remove billNo from cell to get first item text
          const rest = strValue.replace(billNo, '').trim();
          // Clone rowArray and replace this cell with just the item text
          const firstItemRowArray = [...rowArray];
          firstItemRowArray[idx] = rest;
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

      // Check if this row contains the bill number
      const billIndex = rowArray.findIndex(
        (value) => value && String(value).trim() === billNo
      );

      if (billIndex >= 0) {
        // Cash is typically the second-to-last column
        // Credit is typically the last column
        if (rowArray.length >= billIndex + 3) {
          const cashValue = rowArray[rowArray.length - 2];
          const creditValue = rowArray[rowArray.length - 1];

          if (cashValue && !isNaN(parseFloat(cashValue))) {
            cash = parseFloat(cashValue);
          }

          if (creditValue && !isNaN(parseFloat(creditValue))) {
            credit = parseFloat(creditValue);
            // Handle negative credit values
            if (credit < 0) credit = Math.abs(credit);
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
      // Process customers sequentially in smaller sub-batches to avoid connection pool exhaustion
      for (let i = 0; i < batch.length; i += 10) {
        const subBatch = batch.slice(i, i + 10);

        await executeWithRetry(async () => {
          // Use a transaction for the sub-batch
          await prisma.$transaction(async (tx) => {
            for (const customer of subBatch) {
              const result = await tx.customer.upsert({
                where: { phone: customer.phone },
                update: { name: customer.name },
                create: customer,
              });
              customerMap.set(customer.phone, result.id);
            }
          });
        });
      }

      // Give connections time to be released
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Get existing bills to avoid duplicates
    const existingBillNos = new Set(
      (
        await executeWithRetry(async () => {
          return prisma.bill.findMany({
            where: {
              billNo: {
                in: validBillRecords.map((bill) => bill.billNo),
              },
            },
            select: { billNo: true },
          });
        })
      ).map((bill) => bill.billNo)
    );

    // Filter out existing bills
    const newBills = validBillRecords.filter(
      (bill) => !existingBillNos.has(bill.billNo)
    );
    console.log(
      `Processing ${newBills.length} new bills (${existingBillNos.size} already exist)`
    );

    // NEW CODE: Pre-calculate MRP for all bills before database insertion
    // Group bills by bill number for proper MRP calculation
    const billsGroupedByNumber = new Map();
    for (const bill of newBills) {
      billsGroupedByNumber.set(bill.billNo, bill);
    }

    // Calculate proper MRP for each bill's items
    for (const bill of billsGroupedByNumber.values()) {
      const totalBillAmount = bill.totalAmount;
      const totalQuantity = bill.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      // Only calculate if we have valid quantities and amount
      if (totalQuantity > 0 && totalBillAmount > 0) {
        const mrpPerUnit = totalBillAmount / totalQuantity;

        // Apply the calculated MRP to each item
        for (const item of bill.items) {
          if (item.mrp === 0) {
            item.mrp = mrpPerUnit;
          }
        }
      }
    }

    // Process new bills in smaller batches
    const billBatches = [];
    for (let i = 0; i < newBills.length; i += BATCH_SIZE) {
      billBatches.push(newBills.slice(i, i + BATCH_SIZE));
    }

    let batchCount = 0;
    for (const billBatch of billBatches) {
      batchCount++;
      console.log(`Processing batch ${batchCount} of ${billBatches.length}`);

      // Process bills sequentially within each batch
      for (const bill of billBatch) {
        try {
          const customerId = customerMap.get(bill.customerPhone);

          if (!customerId) {
            console.warn(
              `Missing customer ID for phone ${bill.customerPhone}, skipping bill ${bill.billNo}`
            );
            continue;
          }

          const netAmount = bill.totalAmount;
          const amountPaid = bill.cash;
          const creditAmount = bill.credit;

          await executeWithRetry(async () => {
            return prisma.$transaction(async (tx) => {
              // Create bill
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
                  paymentType: creditAmount > 0 ? "CREDIT" : "CASH",
                  isUploaded: true,
                },
              });

              // Prepare all bill details for bulk insert
              const billDetails = [];
              for (const item of bill.items) {
                // MRP is already calculated above, use it directly
                billDetails.push({
                  billId: newBill.id,
                  item: item.name,
                  quantity: item.quantity,
                  batch: item.batch || "",
                  expBatch: item.expBatch || "",
                  mrp: item.mrp,
                  discount: 0,
                });
              }

              // Create bill details in smaller chunks to avoid timeouts
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

          totalBills++;
          totalItems += bill.items.length;
        } catch (error) {
          console.error(`Error processing bill ${bill.billNo}:`, error.message);
        }
      }

      // Update progress after each batch
      const processingProgress = (batchCount / billBatches.length) * 100;
      parentPort.postMessage({
        status: "progress",
        progress: 90 + processingProgress * 0.1, // 90-100% for DB operations
      });
      // Final completion message

      // Give connections time to be released between batches
      await prisma.$disconnect();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await prisma.$connect();
    }
    console.timeEnd("Database operations");

    const endTime = Date.now();
    const processingTimeSeconds = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`Processing completed in ${processingTimeSeconds} seconds`);
    console.log(`Bills created: ${totalBills}, Items created: ${totalItems}`);

    parentPort.postMessage({
      status: "completed",
      stats: {
        totalProcessed: processedRows,
        billsExtracted: billRecords.length,
        billsCreated: totalBills,
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
