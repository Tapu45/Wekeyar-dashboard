"use strict";
const { workerData, parentPort } = require('worker_threads');
const ExcelJS = require('exceljs');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const { promisify } = require('util');
const pipeline = promisify(stream.pipeline);
const prisma = new PrismaClient({
    log: ['error'],
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});
const BATCH_SIZE = 50;
async function executeWithRetry(operation, maxRetries = 3) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            if ((error.message.includes('connection pool') || error.message.includes('timed out')) && attempt < maxRetries) {
                console.log(`Retrying operation, attempt ${attempt}/${maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                lastError = error;
            }
            else {
                throw error;
            }
        }
    }
    throw lastError;
}
async function processExcelFile() {
    let currentProgress = 0;
    try {
        const { fileUrl } = workerData;
        console.log(`Downloading file from Cloudinary: ${fileUrl}`);
        const response = await axios({
            method: 'get',
            url: fileUrl,
            responseType: 'stream'
        });
        const startTime = Date.now();
        const storeMap = new Map();
        const customerMap = new Map();
        let billMap = new Map();
        let totalBills = 0;
        let totalItems = 0;
        let storeInfo = {
            name: '',
            address: '',
            phone: '',
            email: ''
        };
        let currentCustomer = null;
        let currentBill = null;
        let lastValidDate = new Date();
        let currentCustomerBills = [];
        let billRecords = [];
        let rowCount = 0;
        let processedRows = 0;
        let lastProgressUpdate = 0;
        const workbook = new ExcelJS.Workbook();
        console.time('Excel parsing');
        await workbook.xlsx.read(response.data);
        console.log('File downloaded and loaded into memory.');
        const worksheet = workbook.getWorksheet(1);
        rowCount = worksheet.rowCount;
        console.timeEnd('Excel parsing');
        console.log(`Found ${rowCount} rows in Excel file`);
        for (let i = 1; i <= Math.min(10, rowCount); i++) {
            const row = worksheet.getRow(i);
            const rowValueArray = [];
            row.eachCell((cell) => {
                rowValueArray.push(cell.value ? String(cell.value).trim() : "");
            });
            const rowString = rowValueArray.join(' ');
            if (!storeInfo.name && rowValueArray[0] &&
                !rowString.includes('SALES STATEMENT') &&
                !rowString.includes('PLOT NO') &&
                !rowString.includes('Phone :')) {
                storeInfo.name = rowValueArray[0].trim();
            }
            if (!storeInfo.address && rowString &&
                (rowString.includes('PLOT NO') ||
                    rowString.includes('AT.PLOT') ||
                    rowString.includes('PIN CODE'))) {
                if (rowValueArray[0]) {
                    storeInfo.address = rowValueArray[0].trim();
                }
            }
            if (rowString && rowString.includes('Phone :') && rowString.includes('E-Mail :')) {
                const phoneMatch = rowString.match(/Phone\s*:\s*(\d+)/);
                const emailMatch = rowString.match(/E-Mail\s*:\s*([^\s]+)/);
                if (phoneMatch)
                    storeInfo.phone = phoneMatch[1];
                if (emailMatch)
                    storeInfo.email = emailMatch[1];
            }
        }
        console.log(`Extracted store information: ${JSON.stringify(storeInfo)}`);
        const sheetRows = [];
        worksheet.eachRow((row, rowNumber) => {
            const rowArray = [];
            row.eachCell((cell) => {
                rowArray.push(cell.value);
            });
            sheetRows.push(rowArray);
        });
        function isCustomerHeader(rowArray) {
            return rowArray.some(value => {
                if (!value)
                    return false;
                const strValue = String(value).trim();
                return /^\d{9,10}\s+\w/.test(strValue);
            });
        }
        function isDateRow(rowArray) {
            return rowArray.some(value => {
                if (!value)
                    return false;
                const strValue = String(value).trim();
                return /^\d{2}-\d{2}-\d{4}$/.test(strValue);
            });
        }
        function extractCustomerInfo(rowArray) {
            for (const value of rowArray) {
                if (!value)
                    continue;
                const strValue = String(value).trim();
                const match = strValue.match(/^(\d+)\s+(.+)$/);
                if (match) {
                    return {
                        phone: match[1],
                        customerName: match[2].trim()
                    };
                }
            }
            return { phone: "unknown", customerName: "Unknown" };
        }
        function extractDate(rowArray) {
            for (const value of rowArray) {
                if (!value)
                    continue;
                const strValue = String(value).trim();
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
            return rowArray.some(value => {
                if (!value)
                    return false;
                const strValue = String(value).trim();
                return /^(CS\/\d+|CN\d+)$/.test(strValue);
            });
        }
        function extractBillNumber(rowArray) {
            for (const value of rowArray) {
                if (!value)
                    continue;
                const strValue = String(value).trim();
                if (/^(CS\/\d+|CN\d+)$/.test(strValue)) {
                    return strValue;
                }
            }
            return null;
        }
        function isItemRow(rowArray) {
            let hasQuantity = false;
            let hasDescription = false;
            let hasBatch = false;
            for (const value of rowArray) {
                if (!value)
                    continue;
                const strValue = String(value).trim();
                if (/^\d+\.0$/.test(strValue)) {
                    hasQuantity = true;
                }
                if (/^\d+\/\d+\s+\w+/.test(strValue)) {
                    hasBatch = true;
                }
                if (strValue.length > 5 && /[A-Z\-]/.test(strValue) && !/^\d/.test(strValue)) {
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
            for (const value of rowArray) {
                if (!value)
                    continue;
                const strValue = String(value).trim();
                if (strValue.length > 5 && /[A-Z\-]/.test(strValue) && !/^\d/.test(strValue)) {
                    name = strValue;
                }
                if (/^\d+\.0$/.test(strValue)) {
                    quantity = parseFloat(strValue);
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
            return rowArray.some(value => {
                if (!value)
                    return false;
                const strValue = String(value).trim();
                return strValue.includes("TOTAL AMOUNT");
            });
        }
        function extractTotalAmount(rowArray) {
            let totalAmount = 0;
            for (let i = 0; i < rowArray.length; i++) {
                const value = rowArray[i];
                if (!value)
                    continue;
                const strValue = String(value).trim();
                if (strValue.includes("TOTAL AMOUNT")) {
                    for (let j = i + 1; j < Math.min(rowArray.length, i + 3); j++) {
                        const amountValue = rowArray[j];
                        if (amountValue && !isNaN(parseFloat(amountValue))) {
                            return parseFloat(amountValue);
                        }
                    }
                }
            }
            if (rowArray[2] && !isNaN(parseFloat(rowArray[2]))) {
                totalAmount = parseFloat(rowArray[2]);
            }
            else if (rowArray[3] && !isNaN(parseFloat(rowArray[3]))) {
                totalAmount = parseFloat(rowArray[3]);
            }
            return totalAmount;
        }
        function extractCashAndCredit(rowArray, billNo) {
            let cash = 0;
            let credit = 0;
            const billIndex = rowArray.findIndex(value => value && String(value).trim() === billNo);
            if (billIndex >= 0) {
                if (rowArray.length >= billIndex + 3) {
                    const cashValue = rowArray[rowArray.length - 2];
                    const creditValue = rowArray[rowArray.length - 1];
                    if (cashValue && !isNaN(parseFloat(cashValue))) {
                        cash = parseFloat(cashValue);
                    }
                    if (creditValue && !isNaN(parseFloat(creditValue))) {
                        credit = parseFloat(creditValue);
                        if (credit < 0)
                            credit = Math.abs(credit);
                    }
                }
            }
            return { cash, credit };
        }
        console.time('Row processing');
        for (let i = 0; i < sheetRows.length; i++) {
            const rowArray = sheetRows[i];
            if (isCustomerHeader(rowArray)) {
                if (currentCustomerBills.length > 0) {
                    billRecords.push(...currentCustomerBills);
                    currentCustomerBills = [];
                }
                const customerInfo = extractCustomerInfo(rowArray);
                let date = lastValidDate;
                if (i + 1 < sheetRows.length && isDateRow(sheetRows[i + 1])) {
                    date = extractDate(sheetRows[i + 1]);
                    i++;
                }
                currentCustomer = {
                    phone: customerInfo.phone,
                    name: customerInfo.customerName,
                    date: date
                };
            }
            else if (currentCustomer && isBillNumberRow(rowArray)) {
                const billNo = extractBillNumber(rowArray);
                let billDate = currentCustomer.date;
                for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
                    if (isDateRow(sheetRows[j])) {
                        billDate = extractDate(sheetRows[j]);
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
                    credit: 0
                };
                const payments = extractCashAndCredit(rowArray, billNo);
                newBill.cash = payments.cash;
                newBill.credit = payments.credit;
                currentCustomerBills.push(newBill);
                currentBill = newBill;
            }
            else if (currentBill && isItemRow(rowArray)) {
                const item = extractItemDetails(rowArray);
                currentBill.items.push(item);
            }
            else if (currentCustomerBills.length > 0 && isBillTotal(rowArray)) {
                let billIndex = -1;
                let billNo = null;
                for (const value of rowArray) {
                    if (!value)
                        continue;
                    const strValue = String(value).trim();
                    if (/^(CS\/\d+|CN\d+)$/.test(strValue)) {
                        billNo = strValue;
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
                    const totalAmount = extractTotalAmount(rowArray);
                    currentCustomerBills[billIndex].totalAmount = totalAmount;
                    if (currentCustomerBills[billIndex].cash === 0 && currentCustomerBills[billIndex].credit === 0) {
                        for (let j = Math.max(0, i - 3); j <= Math.min(sheetRows.length - 1, i + 3); j++) {
                            const nearbyRow = sheetRows[j];
                            const billNoIndex = nearbyRow.findIndex(value => value && String(value).trim() === currentCustomerBills[billIndex].billNo);
                            if (billNoIndex >= 0) {
                                const payments = extractCashAndCredit(nearbyRow, currentCustomerBills[billIndex].billNo);
                                if (payments.cash > 0 || payments.credit !== 0) {
                                    currentCustomerBills[billIndex].cash = payments.cash;
                                    currentCustomerBills[billIndex].credit = payments.credit;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            else if (rowArray && currentCustomerBills.length > 0) {
                let billNo = null;
                for (const value of rowArray) {
                    if (!value)
                        continue;
                    const strValue = String(value).trim();
                    if (/^(CS|CN)\/\d+$/.test(strValue)) {
                        billNo = strValue;
                        break;
                    }
                }
                if (billNo) {
                    const billIndex = currentCustomerBills.findIndex(bill => bill.billNo === billNo);
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
            if (currentProgress - lastProgressUpdate >= 1 || i === sheetRows.length - 1) {
                parentPort.postMessage({
                    status: 'progress',
                    progress: parseFloat(currentProgress.toFixed(1))
                });
                lastProgressUpdate = currentProgress;
            }
        }
        console.timeEnd('Row processing');
        if (currentCustomerBills.length > 0) {
            billRecords.push(...currentCustomerBills);
        }
        console.log(`Processed ${billRecords.length} bills, preparing for database insertion`);
        const validBillRecords = billRecords.filter(bill => {
            if (bill.cash === 0 && bill.credit === 0 && bill.totalAmount > 0) {
                bill.cash = bill.totalAmount;
            }
            return !!bill.billNo;
        });
        console.log(`Found ${validBillRecords.length} valid bills to insert`);
        console.time('Database operations');
        const store = await executeWithRetry(async () => {
            return prisma.store.upsert({
                where: { storeName: storeInfo.name },
                update: {
                    address: storeInfo.address,
                    phone: storeInfo.phone,
                    email: storeInfo.email
                },
                create: {
                    storeName: storeInfo.name,
                    address: storeInfo.address,
                    phone: storeInfo.phone,
                    email: storeInfo.email
                },
            });
        });
        const storeId = store.id;
        const uniqueCustomers = new Map();
        validBillRecords.forEach(bill => {
            uniqueCustomers.set(bill.customerPhone, bill.customerName);
        });
        const customerData = Array.from(uniqueCustomers).map(([phone, name]) => ({
            phone,
            name,
            address: null
        }));
        const customerBatches = [];
        for (let i = 0; i < customerData.length; i += BATCH_SIZE) {
            customerBatches.push(customerData.slice(i, i + BATCH_SIZE));
        }
        for (const batch of customerBatches) {
            for (let i = 0; i < batch.length; i += 10) {
                const subBatch = batch.slice(i, i + 10);
                await executeWithRetry(async () => {
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
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        const existingBillNos = new Set((await executeWithRetry(async () => {
            return prisma.bill.findMany({
                where: {
                    billNo: {
                        in: validBillRecords.map(bill => bill.billNo)
                    }
                },
                select: { billNo: true }
            });
        })).map(bill => bill.billNo));
        const newBills = validBillRecords.filter(bill => !existingBillNos.has(bill.billNo));
        console.log(`Processing ${newBills.length} new bills (${existingBillNos.size} already exist)`);
        const billsGroupedByNumber = new Map();
        for (const bill of newBills) {
            billsGroupedByNumber.set(bill.billNo, bill);
        }
        for (const bill of billsGroupedByNumber.values()) {
            const totalBillAmount = bill.totalAmount;
            const totalQuantity = bill.items.reduce((sum, item) => sum + item.quantity, 0);
            if (totalQuantity > 0 && totalBillAmount > 0) {
                const mrpPerUnit = totalBillAmount / totalQuantity;
                for (const item of bill.items) {
                    if (item.mrp === 0) {
                        item.mrp = mrpPerUnit;
                    }
                }
            }
        }
        const billBatches = [];
        for (let i = 0; i < newBills.length; i += BATCH_SIZE) {
            billBatches.push(newBills.slice(i, i + BATCH_SIZE));
        }
        let batchCount = 0;
        for (const billBatch of billBatches) {
            batchCount++;
            console.log(`Processing batch ${batchCount} of ${billBatches.length}`);
            for (const bill of billBatch) {
                try {
                    const customerId = customerMap.get(bill.customerPhone);
                    if (!customerId) {
                        console.warn(`Missing customer ID for phone ${bill.customerPhone}, skipping bill ${bill.billNo}`);
                        continue;
                    }
                    const netAmount = bill.totalAmount;
                    const amountPaid = bill.cash;
                    const creditAmount = bill.credit;
                    await executeWithRetry(async () => {
                        return prisma.$transaction(async (tx) => {
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
                            const billDetails = [];
                            for (const item of bill.items) {
                                billDetails.push({
                                    billId: newBill.id,
                                    item: item.name,
                                    quantity: item.quantity,
                                    batch: item.batch || '',
                                    expBatch: item.expBatch || '',
                                    mrp: item.mrp,
                                    discount: 0,
                                });
                            }
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
                }
                catch (error) {
                    console.error(`Error processing bill ${bill.billNo}:`, error.message);
                }
            }
            const processingProgress = (batchCount / billBatches.length) * 100;
            parentPort.postMessage({
                status: 'progress',
                progress: 90 + (processingProgress * 0.1)
            });
            await prisma.$disconnect();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await prisma.$connect();
        }
        console.timeEnd('Database operations');
        const endTime = Date.now();
        const processingTimeSeconds = ((endTime - startTime) / 1000).toFixed(2);
        console.log(`Processing completed in ${processingTimeSeconds} seconds`);
        console.log(`Bills created: ${totalBills}, Items created: ${totalItems}`);
        parentPort.postMessage({
            status: 'completed',
            stats: {
                totalProcessed: processedRows,
                billsExtracted: billRecords.length,
                billsCreated: totalBills,
                itemsCreated: totalItems,
                processingTimeSeconds: processingTimeSeconds
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
        try {
            await prisma.$disconnect();
        }
        catch (cleanupError) {
            console.error('Error during cleanup:', cleanupError);
        }
    }
}
processExcelFile();
//# sourceMappingURL=excelProccessor.js.map