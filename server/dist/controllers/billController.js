"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postDailyBills = postDailyBills;
const client_1 = require("@prisma/client");
async function postDailyBills(req, res) {
    const prisma = new client_1.PrismaClient();
    const { bill } = req.body;
    try {
        if (!bill) {
            console.log("Invalid request body", bill);
            return res.status(400).json({ error: "Invalid request body" });
        }
        console.log("Processing bill input");
        const billSegments = bill.split(/Apr \d+ \d+:\d+:\d+ PMCreating bill/);
        const billsToProcess = billSegments.length > 1
            ? billSegments.map((segment, index) => index === 0 ? segment : "Creating bill" + segment)
            : [bill];
        const processedBills = [];
        const failedBills = [];
        for (const billText of billsToProcess) {
            if (!billText.trim())
                continue;
            try {
                const lines = billText.split('\n');
                const billData = {
                    items: []
                };
                const cleanedLines = lines.map((line) => {
                    return line.replace(/^Apr \d+ \d+:\d+:\d+ [AP]M/, '').trim();
                }).filter((line) => line !== '');
                const isNonBillFormat = cleanedLines.some((line) => line.includes("Weekly Sale Report") ||
                    line.includes("SALE REPORT") ||
                    line.includes("TOTAL NET SALE") ||
                    (line.includes("SALE") && line.includes("RETURN") && line.includes("NET SALE")));
                if (isNonBillFormat) {
                    console.log("Detected non-bill format, skipping");
                    failedBills.push({
                        error: "Non-bill format detected",
                        billText: billText.substring(0, 100) + "..."
                    });
                    continue;
                }
                for (let i = 0; i < cleanedLines.length; i++) {
                    const line = cleanedLines[i];
                    if (line.includes("Creating bill")) {
                        billData.billNo = line.replace("Creating bill", "").trim();
                        break;
                    }
                    else if (line.match(/^[A-Z]{2}\d+$/)) {
                        billData.billNo = line;
                        break;
                    }
                    else if (line && /^[A-Z]+\/\d+$/.test(line)) {
                        billData.billNo = line;
                        break;
                    }
                }
                if (billData.billNo && billData.billNo.startsWith("CN")) {
                    billData.isReturnBill = true;
                }
                else {
                    billData.isReturnBill = false;
                }
                const dateIndex = cleanedLines.findIndex((line) => line.match(/^\d{2}-\d{2}-\d{4}$/));
                if (dateIndex !== -1) {
                    const [day, month, year] = cleanedLines[dateIndex].split('-');
                    billData.date = new Date(`${year}-${month}-${day}`);
                }
                else {
                    billData.date = new Date();
                }
                const paymentIndex = cleanedLines.findIndex((line) => line.includes("BILL") && (line.includes("CASH") || line.includes("CREDIT")));
                billData.customerName = null;
                billData.customerPhone = null;
                if (paymentIndex > 0 && paymentIndex < cleanedLines.length) {
                    for (let i = 0; i < paymentIndex; i++) {
                        if (cleanedLines[i].match(/^\d{10}$/)) {
                            billData.customerPhone = cleanedLines[i];
                            for (let j = i - 1; j >= 0; j--) {
                                const line = cleanedLines[j];
                                if (!line.match(/^\d{2}-\d{2}-\d{4}$/) &&
                                    !line.includes("TIME:") &&
                                    !line.match(/^\d+$/) &&
                                    line.length > 2) {
                                    billData.customerName = line;
                                    break;
                                }
                            }
                            break;
                        }
                    }
                    if (!billData.customerName && dateIndex !== -1) {
                        for (let i = dateIndex + 1; i < paymentIndex; i++) {
                            const line = cleanedLines[i];
                            if (!line.includes("TIME:") &&
                                !line.match(/^\d+$/) &&
                                !line.includes("BILL") &&
                                !line.includes("/") &&
                                line.length > 2) {
                                billData.customerName = line;
                                break;
                            }
                        }
                    }
                }
                billData.storeName = null;
                billData.storeLocation = null;
                billData.storePhone = null;
                if (paymentIndex !== -1) {
                    const potentialStoreLines = [];
                    for (let i = paymentIndex + 1; i < cleanedLines.length; i++) {
                        const line = cleanedLines[i];
                        if (line && line.length > 2 && !line.match(/^\d+(\.\d{2})?$/)) {
                            potentialStoreLines.push(line);
                        }
                        if (potentialStoreLines.length >= 4 || i > paymentIndex + 5)
                            break;
                    }
                    if (potentialStoreLines.length > 0) {
                        for (let i = 0; i < potentialStoreLines.length; i++) {
                            const line = potentialStoreLines[i];
                            const isDoctorName = line.match(/^DR\.?\s/i);
                            if (!isDoctorName) {
                                billData.storeName = line;
                                if (i + 1 < potentialStoreLines.length) {
                                    billData.storeLocation = potentialStoreLines[i + 1];
                                    if (i + 2 < potentialStoreLines.length &&
                                        potentialStoreLines[i + 2].match(/^\d{10}$/)) {
                                        billData.storePhone = potentialStoreLines[i + 2];
                                    }
                                }
                                break;
                            }
                        }
                        if (!billData.storeName) {
                            for (let i = 0; i < potentialStoreLines.length - 1; i++) {
                                const line = potentialStoreLines[i];
                                const nextLine = potentialStoreLines[i + 1];
                                const isDoctorName = line.match(/^DR\.?\s/i);
                                if (isDoctorName && nextLine) {
                                    billData.storeName = nextLine;
                                    if (i + 2 < potentialStoreLines.length) {
                                        billData.storeLocation = potentialStoreLines[i + 2];
                                        if (i + 3 < potentialStoreLines.length &&
                                            potentialStoreLines[i + 3].match(/^\d{10}$/)) {
                                            billData.storePhone = potentialStoreLines[i + 3];
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
                if (paymentIndex !== -1) {
                    billData.paymentType = cleanedLines[paymentIndex].toLowerCase().includes("cash") ? "cash" : "credit";
                }
                const amountTextIndex = cleanedLines.findIndex((line) => line.startsWith("Rs.") && line.includes("Only"));
                if (amountTextIndex !== -1) {
                    billData.amountText = cleanedLines[amountTextIndex];
                    const softwareLineIndex = cleanedLines.findIndex((line) => line.toLowerCase().includes("our software") ||
                        line.toLowerCase().includes("software") ||
                        line.toLowerCase().includes("marg erp"));
                    if (softwareLineIndex !== -1) {
                        for (let i = softwareLineIndex - 1; i >= Math.max(0, amountTextIndex - 3); i--) {
                            const line = cleanedLines[i];
                            if (line.match(/^\d+\.\d{2}$/)) {
                                billData.amountPaid = parseFloat(line);
                                break;
                            }
                        }
                    }
                    if (!billData.amountPaid) {
                        let decimalValues = [];
                        for (let i = Math.max(0, amountTextIndex - 3); i < Math.min(cleanedLines.length, amountTextIndex + 4); i++) {
                            const line = cleanedLines[i];
                            if (line.match(/^\d+\.\d{2}$/)) {
                                decimalValues.push(parseFloat(line));
                            }
                        }
                        if (decimalValues.length >= 3) {
                            decimalValues.sort((a, b) => a - b);
                            billData.calculatedAmount = decimalValues[1];
                            billData.netDiscount = decimalValues[0];
                            billData.amountPaid = decimalValues[2];
                        }
                        else if (decimalValues.length > 0) {
                            billData.amountPaid = decimalValues[decimalValues.length - 1];
                        }
                    }
                }
                const medicineItems = [];
                let itemStartIndices = [];
                cleanedLines.forEach((line, index) => {
                    if ((line.match(/^[1-9]$/) || line.match(/^[1-9]:[0-9]$/)) && index < cleanedLines.length - 5) {
                        itemStartIndices.push(index);
                    }
                });
                if (itemStartIndices.length === 0) {
                    cleanedLines.forEach((line, index) => {
                        if (line.match(/^[1-9]\d*$/) &&
                            index + 1 < cleanedLines.length &&
                            !cleanedLines[index + 1].match(/^\d+(\.\d{2})?$/)) {
                            itemStartIndices.push(index);
                        }
                    });
                }
                for (let i = 0; i < itemStartIndices.length; i++) {
                    const startIndex = itemStartIndices[i];
                    const endIndex = i < itemStartIndices.length - 1
                        ? itemStartIndices[i + 1]
                        : Math.min(cleanedLines.length, startIndex + 15);
                    const itemLines = cleanedLines.slice(startIndex, endIndex);
                    if (itemLines.length < 4)
                        continue;
                    let quantity = parseInt(itemLines[0]);
                    if (isNaN(quantity)) {
                        const parts = itemLines[0].split(':');
                        if (parts.length === 2) {
                            quantity = parseInt(parts[0]);
                        }
                        if (isNaN(quantity))
                            continue;
                    }
                    const itemName = itemLines[1];
                    let batch = "";
                    let expBatch = "";
                    let mrp = 0;
                    let discount = 0;
                    for (let j = 2; j < itemLines.length; j++) {
                        const line = itemLines[j];
                        if (!batch && line.match(/^\d+$/)) {
                            batch = line;
                            continue;
                        }
                        if (batch && !expBatch && line.match(/^\d{1,2}\/\d{2,4}$/)) {
                            expBatch = line;
                            continue;
                        }
                        if (expBatch && line.match(/^\d+\.\d{2}$/)) {
                            if (mrp === 0) {
                                mrp = parseFloat(line);
                            }
                            else if (discount === 0) {
                                discount = parseFloat(line);
                                break;
                            }
                        }
                    }
                    if (batch && expBatch && mrp > 0) {
                        medicineItems.push({
                            quantity,
                            item: itemName,
                            batch,
                            expBatch,
                            mrp,
                            discount
                        });
                    }
                }
                if (medicineItems.length > 0) {
                    billData.items = medicineItems;
                }
                console.log("Extracted bill data:", JSON.stringify(billData, null, 2));
                if (!billData.billNo || !billData.date || isNaN(billData.date.getTime())) {
                    console.log("Invalid bill data: Missing essential bill information");
                    failedBills.push({
                        error: "Missing essential bill information (bill number or date)",
                        billData
                    });
                    continue;
                }
                if (!billData.storeName) {
                    console.log("Invalid bill data: Missing store information");
                    failedBills.push({
                        error: "Missing store information",
                        billData
                    });
                    continue;
                }
                let customer;
                const hasCustomerName = billData.customerName && billData.customerName.trim() !== '';
                const hasCustomerPhone = billData.customerPhone && billData.customerPhone.trim() !== '';
                if (hasCustomerName && hasCustomerPhone) {
                    customer = await prisma.customer.upsert({
                        where: { phone: billData.customerPhone },
                        update: {
                            name: billData.customerName,
                            ...(billData.customerAddress && { address: billData.customerAddress })
                        },
                        create: {
                            name: billData.customerName,
                            phone: billData.customerPhone,
                            address: null,
                        }
                    });
                }
                else if (hasCustomerName && !hasCustomerPhone) {
                    customer = await prisma.customer.upsert({
                        where: { phone: "9999999999" },
                        update: {
                            name: billData.customerName,
                            ...(billData.customerAddress && { address: billData.customerAddress })
                        },
                        create: {
                            name: billData.customerName,
                            phone: "9999999999",
                            address: null,
                        }
                    });
                }
                else if (!hasCustomerName && hasCustomerPhone) {
                    customer = await prisma.customer.upsert({
                        where: { phone: billData.customerPhone },
                        update: {
                            name: "Unknown Customer",
                            ...(billData.customerAddress && { address: billData.customerAddress })
                        },
                        create: {
                            name: "Unknown Customer",
                            phone: billData.customerPhone,
                            address: null,
                        }
                    });
                }
                else {
                    customer = await prisma.customer.upsert({
                        where: { phone: "9999999999" },
                        update: {
                            name: "Cashlist Customer",
                            ...(billData.customerAddress && { address: billData.customerAddress })
                        },
                        create: {
                            name: "Cashlist Customer",
                            phone: "9999999999",
                            address: null,
                        }
                    });
                }
                let store;
                try {
                    store = await prisma.store.upsert({
                        where: { storeName: billData.storeName },
                        update: {
                            ...(billData.storeLocation && { address: billData.storeLocation }),
                            ...(billData.storePhone && { phone: billData.storePhone })
                        },
                        create: {
                            storeName: billData.storeName,
                            address: billData.storeLocation || null,
                            phone: billData.storePhone || null,
                        }
                    });
                }
                catch (error) {
                    throw new Error(`Store creation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
                }
                const billDetails = billData.items.map((item) => {
                    return {
                        item: item.item || "Unknown Item",
                        quantity: item.quantity || 1,
                        batch: item.batch || "",
                        expBatch: item.expBatch || "",
                        mrp: item.mrp || 0,
                        discount: item.discount || 0,
                    };
                });
                const existingBill = await prisma.bill.findUnique({
                    where: { billNo: billData.billNo }
                });
                if (existingBill) {
                    console.log(`Bill with number ${billData.billNo} already exists`);
                    failedBills.push({
                        error: "Bill already exists",
                        billNo: billData.billNo
                    });
                    continue;
                }
                const newBill = await prisma.bill.create({
                    data: {
                        billNo: billData.billNo,
                        customerId: customer.id,
                        storeId: store.id,
                        date: billData.date,
                        netDiscount: billData.netDiscount || 0,
                        netAmount: 0,
                        amountPaid: billData.isReturnBill ?
                            -(billData.amountPaid || billData.calculatedAmount || 0) :
                            (billData.amountPaid || billData.calculatedAmount || 0),
                        creditAmount: 0,
                        paymentType: billData.paymentType || "cash",
                        isUploaded: true,
                        billDetails: {
                            create: billDetails
                        }
                    },
                    include: {
                        billDetails: true
                    }
                });
                processedBills.push({
                    billNo: billData.billNo,
                    billId: newBill.id,
                    parsedData: billData,
                    billWithDetails: newBill
                });
            }
            catch (error) {
                console.log("Failed bill:", error instanceof Error ? error.message : "Unknown error");
                failedBills.push({
                    error: error instanceof Error ? error.message : "Unknown error",
                    billText: billText.substring(0, 100) + "..."
                });
                continue;
            }
        }
        if (processedBills.length > 0) {
            return res.status(200).json({
                success: true,
                message: `${processedBills.length} bill(s) processed successfully${failedBills.length > 0 ? `, ${failedBills.length} failed` : ''}`,
                bills: processedBills,
                ...(failedBills.length > 0 && { failedBills })
            });
        }
        else if (failedBills.length > 0) {
            const existingBillErrors = failedBills.filter(bill => bill.error === "Bill already exists" ||
                (typeof bill.error === "string" && bill.error.includes("already exists")));
            if (existingBillErrors.length > 0) {
                console.log("Failed bills, done fixing:", existingBillErrors.length);
                return res.status(200).json({
                    success: true,
                    message: "Bills already exist in database"
                });
            }
            return res.status(400).json({
                success: false,
                message: `All ${failedBills.length} bill(s) failed to process`,
                failedBills
            });
        }
        else {
            return res.status(400).json({
                success: false,
                message: "No bills to process"
            });
        }
    }
    catch (error) {
        console.error("Error in postDailyBills:", error);
        return res.status(500).json({
            error: "Failed to process bills",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
    finally {
        await prisma.$disconnect();
    }
}
//# sourceMappingURL=billController.js.map