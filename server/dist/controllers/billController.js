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
        console.log(bill);
        if (bill.includes("Weekly Sale Report") ||
            (bill.includes("TOTAL NET SALE") && bill.includes("TOTAL COLLECTION")) ||
            (bill.includes("SALE") && bill.includes("RETURN") && bill.includes("NET SALE") && bill.includes("COLLECTION"))) {
            console.log("Detected a summary report instead of a bill - skipping processing");
            return res.status(200).json({
                success: false,
                message: "Input appears to be a summary report rather than individual bills"
            });
        }
        const billSegments = bill.split(/Apr \d+ \d+:\d+:\d+ PMCreating bill/);
        const billsToProcess = billSegments.length > 1
            ? billSegments.map((segment, index) => index === 0 ? segment : "Creating bill" + segment)
            : [bill];
        const processedBills = [];
        const failedBills = [];
        const knownStores = [
            "RUCHIKA",
            "WEKEYAR PLUS",
            "MAUSIMAA SQUARE",
            "DUMDUMA",
            "SUM HOSPITAL",
            "SAMANTARAPUR",
            "GGP COLONY",
            "CHANDRASEKHARPUR",
            "KALINGA VIHAR",
            "VSS NAGAR",
            "IRC VILLAGE"
        ];
        for (const billText of billsToProcess) {
            if (!billText.trim())
                continue;
            try {
                const lines = billText.split('\n');
                const billData = {
                    items: []
                };
                const cleanedLines = lines.map((line) => {
                    return line.replace(/^Apr \d+ \d+:\d+:\d+ [AP]M|^May \d+ \d+:\d+:\d+ [AP]M/, '').trim();
                }).filter((line) => line !== '');
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
                if (paymentIndex > 0) {
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
                if (billData.customerName && paymentIndex !== -1 &&
                    cleanedLines[paymentIndex + 1] === billData.customerName) {
                    billData.customerName = null;
                }
                if (billData.customerName &&
                    (billData.customerName.match(/^[A-Z]+\/\d+$/) ||
                        billData.customerName.match(/^[A-Z]{2}\d+$/))) {
                    billData.customerName = null;
                }
                if (paymentIndex !== -1) {
                    billData.paymentType = cleanedLines[paymentIndex].toLowerCase().includes("cash") ? "cash" : "credit";
                }
                if (paymentIndex !== -1) {
                    let foundKnownStore = false;
                    for (let i = paymentIndex + 1; i < Math.min(paymentIndex + 5, cleanedLines.length); i++) {
                        const line = cleanedLines[i];
                        const matchedStore = knownStores.find(store => line.toUpperCase() === store.toUpperCase());
                        if (matchedStore) {
                            billData.storeName = matchedStore;
                            foundKnownStore = true;
                            if (i + 1 < cleanedLines.length) {
                                billData.storeLocation = cleanedLines[i + 1];
                            }
                            if (i + 2 < cleanedLines.length &&
                                cleanedLines[i + 2].match(/^\d{10}$/)) {
                                billData.storePhone = cleanedLines[i + 2];
                            }
                            break;
                        }
                    }
                    if (!foundKnownStore) {
                        if (paymentIndex + 1 < cleanedLines.length) {
                            billData.storeName = cleanedLines[paymentIndex + 1];
                        }
                        if (paymentIndex + 2 < cleanedLines.length) {
                            billData.storeLocation = cleanedLines[paymentIndex + 2];
                        }
                        if (paymentIndex + 3 < cleanedLines.length &&
                            cleanedLines[paymentIndex + 3].match(/^\d{10}$/)) {
                            billData.storePhone = cleanedLines[paymentIndex + 3];
                        }
                    }
                }
                const amountTextIndex = cleanedLines.findIndex((line) => line.startsWith("Rs.") && (line.includes("Only") || line.includes("only")));
                if (amountTextIndex !== -1) {
                    billData.amountText = cleanedLines[amountTextIndex];
                    const softwareLineIndex = cleanedLines.findIndex((line) => line.toLowerCase().includes("our software") ||
                        line.toLowerCase().includes("software") ||
                        line.toLowerCase().includes("marg erp"));
                    if (softwareLineIndex !== -1) {
                        const searchWindow = cleanedLines.slice(amountTextIndex + 1, softwareLineIndex);
                        let lastFoundAmount = null;
                        for (const line of searchWindow) {
                            if (line.match(/^\d+\.\d{2}$/)) {
                                lastFoundAmount = parseFloat(line);
                            }
                        }
                        if (lastFoundAmount !== null) {
                            billData.amountPaid = lastFoundAmount;
                        }
                    }
                }
                const medicineItems = [];
                const gstLineIndex = cleanedLines.findIndex((line) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]/.test(line));
                const startIndex = gstLineIndex !== -1 ? gstLineIndex + 1 : 0;
                for (let i = startIndex; i < cleanedLines.length; i++) {
                    const line = cleanedLines[i];
                    let matched = false;
                    let quantity = 0;
                    let itemName = '';
                    if (line.startsWith("Rs.") && line.includes("Only")) {
                        break;
                    }
                    if (/^\d+:\d+\s+\S/.test(line)) {
                        const quantityParts = line.split(' ');
                        if (quantityParts.length >= 2) {
                            const quantityMatch = quantityParts[0].match(/^(\d+):(\d+)$/);
                            if (quantityMatch) {
                                const firstNumber = parseInt(quantityMatch[1]);
                                const secondNumber = parseInt(quantityMatch[2]);
                                quantity = firstNumber > 0 ? firstNumber : secondNumber;
                            }
                            else {
                                quantity = 1;
                            }
                            itemName = line.substring(line.indexOf(' ')).trim();
                            matched = true;
                        }
                    }
                    else if (/^\d+:\d+$/.test(line)) {
                        const quantityMatch = line.match(/^(\d+):(\d+)$/);
                        if (quantityMatch && i + 1 < cleanedLines.length) {
                            if (!(/^\d+$/.test(cleanedLines[i + 1])) &&
                                !(/^\d{1,2}\/\d{2,4}$/.test(cleanedLines[i + 1])) &&
                                !(/^[A-Z0-9]+$/.test(cleanedLines[i + 1]) && cleanedLines[i + 1].length <= 6) &&
                                !cleanedLines[i + 1].startsWith("Rs.")) {
                                const firstNumber = parseInt(quantityMatch[1]);
                                const secondNumber = parseInt(quantityMatch[2]);
                                quantity = firstNumber > 0 ? firstNumber : secondNumber;
                                itemName = cleanedLines[i + 1];
                                matched = true;
                                i++;
                            }
                        }
                    }
                    else if (/^[1-9]\d{0,2}$/.test(line)) {
                        quantity = parseInt(line);
                        if (i + 1 < cleanedLines.length &&
                            !(/^\d+$/.test(cleanedLines[i + 1])) &&
                            !(/^\d{1,2}\/\d{2,4}$/.test(cleanedLines[i + 1])) &&
                            !(/^[A-Z0-9]+$/.test(cleanedLines[i + 1]) && cleanedLines[i + 1].length <= 6) &&
                            !cleanedLines[i + 1].startsWith("Rs.")) {
                            itemName = cleanedLines[i + 1];
                            matched = true;
                            i++;
                        }
                    }
                    if (matched) {
                        const item = {
                            quantity: quantity,
                            item: itemName,
                            batch: '',
                            expBatch: '',
                            mrp: 0,
                            discount: 0
                        };
                        let lineIndex = i + 1;
                        let decimalValuesFound = 0;
                        while (lineIndex < cleanedLines.length && lineIndex < i + 10) {
                            const nextLine = cleanedLines[lineIndex];
                            if (/^\d+:\d+/.test(nextLine) ||
                                /^[1-9]\d{0,2}$/.test(nextLine) ||
                                nextLine.startsWith("Rs.")) {
                                break;
                            }
                            if (lineIndex === i + 1 && /^[A-Z0-9]+$/.test(nextLine) && nextLine.length <= 6) {
                                item.batch = nextLine;
                            }
                            else if (/^\d{1,2}\/\d{2,4}$/.test(nextLine)) {
                                item.expBatch = nextLine;
                            }
                            else if (/^\d+\.\d{2}$/.test(nextLine)) {
                                decimalValuesFound++;
                                if (decimalValuesFound === 1) {
                                    item.mrp = parseFloat(nextLine);
                                }
                                else if (decimalValuesFound === 6) {
                                    item.discount = parseFloat(nextLine);
                                }
                            }
                            lineIndex++;
                        }
                        medicineItems.push(item);
                    }
                }
                if (medicineItems.length > 0) {
                    billData.items = medicineItems;
                }
                console.log("Extracted bill data:", JSON.stringify(billData, null, 2));
                if (!billData.billNo || !billData.date || isNaN(billData.date.getTime())) {
                    console.error("Invalid bill data:", billData);
                    failedBills.push({
                        error: "Missing essential bill information (bill number or date)",
                        billText: billText.substring(0, 100) + "..."
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
                if (billData.storeName) {
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
                }
                else {
                    throw new Error("Missing store information");
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
                    console.error(`Bill with number ${billData.billNo} already exists`);
                    return res.status(200).json({ success: true });
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
                console.error("Error processing bill:", error);
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
            failedBills.map((bill) => {
                console.log("Failed bill:", bill.error);
                console.log("Failed bill:", bill.error.includes("already exists"));
            });
            const allMissingEssentialInfo = failedBills.every(bill => bill.error === "Missing essential bill information (bill number or date)" ||
                bill.error.includes("already exists"));
            if (allMissingEssentialInfo) {
                console.log("All bills failed due to missing essential info - marking as success to prevent retries");
                return res.status(200).json({
                    success: true,
                    message: "Bills skipped due to missing essential information",
                    skippedBills: failedBills.length
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