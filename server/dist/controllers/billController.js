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
            res.status(400).json({ error: "Invalid request body" });
            return;
        }
        console.log("Processing bill", bill);
        const lines = bill.split('\n');
        const billData = {
            items: []
        };
        const cleanedLines = lines.map((line) => {
            return line.replace(/^Apr \d+ \d+:\d+:\d+ [AP]M/, '').trim();
        }).filter((line) => line !== '');
        for (let i = 0; i < cleanedLines.length; i++) {
            const line = cleanedLines[i];
            if (line.includes("Creating bill")) {
                billData.billType = line.replace("Creating bill", "").trim();
            }
            else if (line.startsWith("Invoice No.") && i + 1 < cleanedLines.length) {
                if (cleanedLines[i + 1] === ":" && i + 2 < cleanedLines.length) {
                    billData.billNo = cleanedLines[i + 2];
                    i += 2;
                }
            }
            else if (line.match(/^BILL[A-Z0-9]+/) || line.match(/^[A-Z]+\d+/)) {
                billData.billNo = line.split("Date:")[0].trim();
                if (line.includes("Date:")) {
                    const dateStr = line.split("Date:")[1].trim();
                    if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
                        const [day, month, year] = dateStr.split('-');
                        billData.date = new Date(`${year}-${month}-${day}`);
                    }
                }
            }
        }
        const storeNameIndex = cleanedLines.findIndex((line) => !line.includes("Creating bill") && line.match(/^[A-Z\s]+$/) && line.length > 5);
        if (storeNameIndex !== -1) {
            billData.storeName = cleanedLines[storeNameIndex];
            for (let i = storeNameIndex + 1; i < storeNameIndex + 4 && i < cleanedLines.length; i++) {
                if (cleanedLines[i] && !cleanedLines[i].startsWith("Phone :") && !cleanedLines[i].startsWith("Website :")) {
                    billData.storeLocation = (billData.storeLocation || "") +
                        (billData.storeLocation ? " " : "") + cleanedLines[i];
                }
            }
        }
        const phoneLineIndex = cleanedLines.findIndex((line) => line.startsWith("Phone :"));
        if (phoneLineIndex !== -1) {
            const phoneMatch = cleanedLines[phoneLineIndex].match(/\d{10}/);
            if (phoneMatch) {
                billData.storePhone = phoneMatch[0];
            }
        }
        const patientNameIndex = cleanedLines.findIndex((line) => line.startsWith("Patient Name :"));
        if (patientNameIndex !== -1 && patientNameIndex + 1 < cleanedLines.length) {
            const nameParts = cleanedLines[patientNameIndex].split(":");
            if (nameParts.length > 1 && nameParts[1].trim()) {
                billData.customerName = nameParts[1].trim();
            }
            else if (!cleanedLines[patientNameIndex + 1].includes(":")) {
                billData.customerName = cleanedLines[patientNameIndex + 1];
            }
        }
        billData.customerPhone = "9999999999";
        const tableHeaderIndex = cleanedLines.findIndex((line) => line.includes("PRODUCT NAME") && line.includes("BATCH") && line.includes("MRP"));
        if (tableHeaderIndex !== -1) {
            let i = tableHeaderIndex + 1;
            while (i < cleanedLines.length) {
                if (cleanedLines[i].match(/^\d+\./)) {
                    const productName = i + 1 < cleanedLines.length ? cleanedLines[i + 1] : "";
                    let j = i + 2;
                    let packSize = "";
                    let batch = "";
                    let expiry = "";
                    let quantity = 0;
                    let mrp = 0;
                    let amount = 0;
                    while (j < cleanedLines.length && !cleanedLines[j].match(/^\d+\./) && !cleanedLines[j].includes("SUB TOTAL")) {
                        const line = cleanedLines[j];
                        if (line.match(/^\d+$/)) {
                            if (!packSize) {
                                packSize = line;
                            }
                            else if (!quantity) {
                                quantity = parseInt(line);
                            }
                            else if (!batch) {
                                batch = line;
                            }
                        }
                        else if (line.match(/^\d+\.\d{2}$/)) {
                            if (!mrp) {
                                mrp = parseFloat(line);
                            }
                            else if (!amount && parseFloat(line) > 100) {
                                amount = parseFloat(line);
                            }
                        }
                        j++;
                    }
                    if (amount > 0 && !quantity) {
                        quantity = 1;
                    }
                    if (productName && amount > 0) {
                        billData.items.push({
                            item: productName,
                            quantity: quantity || 1,
                            batch: batch || "",
                            expBatch: expiry || "",
                            mrp: mrp || amount,
                            discount: 0
                        });
                    }
                    if (j < cleanedLines.length && cleanedLines[j].includes("SUB TOTAL")) {
                        break;
                    }
                    i = j;
                }
                else {
                    i++;
                }
            }
        }
        const grandTotalIndex = cleanedLines.findIndex((line) => line === "GRAND TOTAL");
        if (grandTotalIndex !== -1 && grandTotalIndex + 1 < cleanedLines.length) {
            const totalLine = cleanedLines[grandTotalIndex + 1];
            if (totalLine.match(/^\d+\.\d{2}$/)) {
                billData.calculatedAmount = parseFloat(totalLine);
            }
        }
        else {
            const subTotalIndex = cleanedLines.findIndex((line) => line === "SUB TOTAL");
            if (subTotalIndex !== -1 && subTotalIndex + 1 < cleanedLines.length) {
                const totalLine = cleanedLines[subTotalIndex + 1];
                if (totalLine.match(/^\d+\.\d{2}$/)) {
                    billData.calculatedAmount = parseFloat(totalLine);
                }
            }
        }
        const amountTextIndex = cleanedLines.findIndex((line) => line.startsWith("Rs."));
        if (amountTextIndex !== -1) {
            billData.amountText = cleanedLines[amountTextIndex];
        }
        billData.paymentType = "cash";
        console.log("Extracted data:", billData);
        console.log("Extracted items:", billData.items);
        let customer = await prisma.customer.findUnique({
            where: { phone: billData.customerPhone }
        });
        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    name: billData.customerName || "Unknown Customer",
                    phone: billData.customerPhone,
                    address: null,
                }
            });
        }
        let store = await prisma.store.findUnique({
            where: { storeName: billData.storeName }
        });
        if (!store) {
            store = await prisma.store.create({
                data: {
                    storeName: billData.storeName || "Unknown Store",
                    address: billData.storeLocation || null,
                    phone: billData.storePhone || null,
                }
            });
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
        console.log("Creating bill details:", billDetails);
        const newBill = await prisma.bill.create({
            data: {
                billNo: billData.billNo || `UNKNOWN-${Date.now()}`,
                customerId: customer.id,
                storeId: store.id,
                date: billData.date || new Date(),
                netDiscount: 0,
                netAmount: 0,
                amountPaid: billData.calculatedAmount || 0,
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
        res.status(200).json({
            success: true,
            message: `Bill ${billData.billNo} created successfully`,
            billId: newBill.id,
            parsedData: billData,
            billWithDetails: newBill
        });
    }
    catch (error) {
        console.error("Error creating bill:", error);
        res.status(500).json({
            error: "Failed to create bill",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
    finally {
        await prisma.$disconnect();
    }
}
//# sourceMappingURL=billController.js.map