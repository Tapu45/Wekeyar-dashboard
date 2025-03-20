"use strict";
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
        const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
        const tempFilePath = path.join(__dirname, "temp.xlsx");
        fs.writeFileSync(tempFilePath, response.data);
        console.log(`File downloaded and saved to: ${tempFilePath}`);
        const workbook = XLSX.readFile(tempFilePath, {
            cellDates: true,
            rawNumbers: false
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: "", header: 'A' });
        console.log(`Parsed ${data.length} rows from Excel file`);
        fs.unlinkSync(tempFilePath);
        const totalRows = data.length;
        let processedRows = 0;
        const storeMap = new Map();
        const customerMap = new Map();
        let billMap = new Map();
        let totalBills = 0;
        let totalItems = 0;
        let storeName = '';
        let storeAddress = '';
        let storePhone = '';
        let storeEmail = '';
        for (let i = 0; i < Math.min(10, data.length); i++) {
            const row = data[i];
            const rowValues = Object.values(row).map(val => String(val || "").trim());
            const rowString = rowValues.join(' ');
            if (!storeName && rowString &&
                !rowString.includes('SALES STATEMENT') &&
                !rowString.includes('PLOT NO') &&
                !rowString.includes('Phone :')) {
                if (row.A && typeof row.A === 'string' && row.A.trim()) {
                    storeName = row.A.trim();
                    console.log(`Found store name: "${storeName}"`);
                }
            }
            if (!storeAddress && rowString &&
                (rowString.includes('PLOT NO') ||
                    rowString.includes('AT.PLOT') ||
                    rowString.includes('PIN CODE'))) {
                if (row.A && typeof row.A === 'string' && row.A.trim()) {
                    storeAddress = row.A.trim();
                    console.log(`Found store address: "${storeAddress}"`);
                }
            }
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
        if (!storeName) {
            storeName = 'WEKEYAR PLUS';
            console.log('Using default store name: WEKEYAR PLUS');
        }
        if (!storeAddress) {
            storeAddress = 'AT.PLOT NO.210,DISTRICT CENTRE, PO.CHANDRASEKHARPUR, BHUBANESWAR,ODISHA';
            console.log('Using default store address');
        }
        const billRecords = [];
        let currentBill = null;
        let currentCustomer = null;
        let lastValidDate = new Date();
        function isCustomerHeader(row) {
            for (const key in row) {
                const value = String(row[key] || "");
                if (/^\d{9,10}\s+\w/.test(value)) {
                    return true;
                }
            }
            return false;
        }
        function isDateRow(row) {
            for (const key in row) {
                const value = String(row[key] || "");
                if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
                    return true;
                }
            }
            return false;
        }
        function extractCustomerInfo(row) {
            for (const key in row) {
                const value = String(row[key] || "");
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
        function extractDate(row) {
            for (const key in row) {
                const value = String(row[key] || "");
                if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
                    const [day, month, year] = value.split("-");
                    const date = new Date(`${year}-${month}-${day}`);
                    lastValidDate = date;
                    return date;
                }
            }
            return lastValidDate;
        }
        function isBillNumberRow(row) {
            for (const key in row) {
                const value = String(row[key] || "");
                if (/^(CS\/\d+|CN\d+)$/.test(value)) {
                    return true;
                }
            }
            return false;
        }
        function extractBillNumber(row) {
            for (const key in row) {
                const value = String(row[key] || "");
                if (/^(CS\/\d+|CN\d+)$/.test(value)) {
                    return value;
                }
            }
            return null;
        }
        function isItemRow(row) {
            let hasQuantity = false;
            let hasDescription = false;
            let hasBatch = false;
            for (const key in row) {
                const value = String(row[key] || "");
                if (/^\d+\.0$/.test(value)) {
                    hasQuantity = true;
                }
                if (/^\d+\/\d+\s+\w+/.test(value)) {
                    hasBatch = true;
                }
                if (value.length > 5 && /[A-Z\-]/.test(value) && !/^\d/.test(value)) {
                    hasDescription = true;
                }
            }
            return hasDescription && (hasQuantity || hasBatch);
        }
        function extractItemDetails(row) {
            let name = "";
            let quantity = 1;
            let batch = "";
            let mrp = 0;
            for (const key in row) {
                const value = String(row[key] || "");
                if (value.length > 5 && /[A-Z\-]/.test(value) && !/^\d/.test(value)) {
                    name = value;
                }
                if (/^\d+\.0$/.test(value)) {
                    quantity = parseFloat(value);
                }
                if (/^\d+\/\d+\s+\w+/.test(value)) {
                    batch = value;
                }
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && numValue > 10) {
                    mrp = numValue;
                }
            }
            return { name, quantity, batch, expBatch: batch, mrp };
        }
        function isBillTotal(row) {
            for (const key in row) {
                const value = String(row[key] || "");
                if (value.includes("TOTAL AMOUNT")) {
                    return true;
                }
            }
            return false;
        }
        function extractTotalAmount(row) {
            let totalAmount = 0;
            for (const key in row) {
                const value = String(row[key] || "");
                if (value.includes("TOTAL AMOUNT")) {
                    for (const amountKey in row) {
                        if (String(amountKey).includes("TOTAL AMOUNT"))
                            continue;
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
            if (totalAmount === 0) {
                for (const key in row) {
                    if (key === 'C' || key === 'D') {
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
        function extractCashAndCredit(row, billNo) {
            let cash = 0;
            let credit = 0;
            let isBillRow = false;
            for (const key in row) {
                if (String(row[key]) === billNo) {
                    isBillRow = true;
                    break;
                }
            }
            if (isBillRow) {
                const columns = Object.keys(row);
                if (columns.length >= 2) {
                    const cashColumn = columns[columns.length - 2];
                    const creditColumn = columns[columns.length - 1];
                    if (row[cashColumn] && !isNaN(parseFloat(row[cashColumn]))) {
                        cash = parseFloat(row[cashColumn]);
                    }
                    if (row[creditColumn] && !isNaN(parseFloat(row[creditColumn]))) {
                        credit = parseFloat(row[creditColumn]);
                        if (credit < 0) {
                            credit = Math.abs(credit);
                        }
                    }
                }
            }
            console.log(`For bill ${billNo}: Cash=${cash}, Credit=${credit}`);
            return { cash, credit };
        }
        let currentCustomerBills = [];
        let lastProgressUpdate = 0;
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            console.log("Processing row:", JSON.stringify(row));
            if (isCustomerHeader(row)) {
                if (currentCustomerBills.length > 0) {
                    billRecords.push(...currentCustomerBills);
                    currentCustomerBills = [];
                }
                const customerInfo = extractCustomerInfo(row);
                let date = lastValidDate;
                if (i + 1 < data.length && isDateRow(data[i + 1])) {
                    date = extractDate(data[i + 1]);
                    i++;
                }
                currentCustomer = {
                    phone: customerInfo.phone,
                    name: customerInfo.customerName,
                    date: date
                };
                console.log(`Created new customer record: ${customerInfo.customerName} with phone ${customerInfo.phone}`);
            }
            else if (currentCustomer && isBillNumberRow(row)) {
                const billNo = extractBillNumber(row);
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
                const payments = extractCashAndCredit(row, billNo);
                newBill.cash = payments.cash;
                newBill.credit = payments.credit;
                currentCustomerBills.push(newBill);
                currentBill = newBill;
                console.log(`Created new bill: ${billNo} with Cash=${newBill.cash}, Credit=${newBill.credit}`);
            }
            else if (currentBill && isItemRow(row)) {
                const item = extractItemDetails(row);
                currentBill.items.push(item);
                console.log(`Added item to bill ${currentBill.billNo}: ${item.name}`);
            }
            else if (currentCustomerBills.length > 0 && isBillTotal(row)) {
                let billIndex = -1;
                let billNo = null;
                for (const key in row) {
                    const value = String(row[key] || "");
                    if (/^(CS\/\d+|CN\d+)$/.test(value)) {
                        billNo = value;
                        break;
                    }
                }
                if (billNo) {
                    billIndex = currentCustomerBills.findIndex(bill => bill.billNo === billNo);
                }
                else {
                    billIndex = currentCustomerBills.length - 1;
                }
                if (billIndex >= 0) {
                    const totalAmount = extractTotalAmount(row);
                    currentCustomerBills[billIndex].totalAmount = totalAmount;
                    if (currentCustomerBills[billIndex].cash === 0 && currentCustomerBills[billIndex].credit === 0) {
                        for (let j = Math.max(0, i - 3); j <= Math.min(data.length - 1, i + 3); j++) {
                            const nearbyRow = data[j];
                            let containsBillNo = false;
                            for (const key in nearbyRow) {
                                if (String(nearbyRow[key]) === currentCustomerBills[billIndex].billNo) {
                                    containsBillNo = true;
                                    break;
                                }
                            }
                            if (containsBillNo) {
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
            else if (row && currentCustomerBills.length > 0) {
                let billNo = null;
                for (const key in row) {
                    const value = String(row[key] || "");
                    if (/^(CS|CN)\/\d+$/.test(value)) {
                        billNo = value;
                        break;
                    }
                }
                if (billNo) {
                    const billIndex = currentCustomerBills.findIndex(bill => bill.billNo === billNo);
                    if (billIndex >= 0) {
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
            const currentProgress = (processedRows / totalRows) * 100;
            if (currentProgress - lastProgressUpdate >= 0.1 || i === data.length - 1) {
                console.log(`Progress: ${currentProgress.toFixed(1)}%`);
                parentPort.postMessage({
                    status: 'progress',
                    progress: parseFloat(currentProgress.toFixed(1))
                });
                lastProgressUpdate = currentProgress;
            }
        }
        if (currentCustomerBills.length > 0) {
            billRecords.push(...currentCustomerBills);
        }
        for (const bill of billRecords) {
            if (bill.cash === 0 && bill.credit === 0 && bill.totalAmount > 0) {
                console.log(`Bill ${bill.billNo} is missing payment information. Attempting to recover.`);
                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    let containsBillNo = false;
                    for (const key in row) {
                        if (String(row[key]) === bill.billNo) {
                            containsBillNo = true;
                            break;
                        }
                    }
                    if (containsBillNo) {
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
                if (bill.cash === 0 && bill.credit === 0) {
                    bill.cash = bill.totalAmount;
                    console.log(`Defaulted bill ${bill.billNo} to cash payment of ${bill.totalAmount}`);
                }
            }
        }
        console.log(`Extracted ${billRecords.length} bill records`);
        for (const bill of billRecords) {
            try {
                if (!bill.billNo) {
                    console.log(`Skipping bill without bill number for customer ${bill.customerName}`);
                    continue;
                }
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
                const existingBill = await prisma.bill.findUnique({
                    where: { billNo: bill.billNo },
                });
                if (existingBill) {
                    console.log(`Bill ${bill.billNo} already exists, skipping`);
                    billMap.set(bill.billNo, existingBill.id);
                    continue;
                }
                const netAmount = bill.totalAmount;
                const amountPaid = bill.cash;
                const creditAmount = bill.credit;
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
                    for (const item of bill.items) {
                        let itemMrp = item.mrp;
                        if (itemMrp === 0 && bill.items.length > 0) {
                            itemMrp = netAmount / bill.items.length;
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
            }
            catch (error) {
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
        await prisma.$disconnect();
    }
    catch (error) {
        console.error('Worker error:', error);
        parentPort.postMessage({
            status: 'error',
            error: error.message
        });
        await prisma.$disconnect();
    }
}
processExcelFile();
//# sourceMappingURL=excelProccessor.js.map