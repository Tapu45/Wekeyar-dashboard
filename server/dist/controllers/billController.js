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
        console.log("Creating bill", bill);
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
                billData.billNo = line.replace("Creating bill", "").trim();
                break;
            }
            else if (line && /\/\d+$/.test(line)) {
                billData.billNo = line;
                break;
            }
        }
        const dateIndex = cleanedLines.findIndex((line) => line.match(/^\d{2}-\d{2}-\d{4}$/));
        if (dateIndex !== -1) {
            const [day, month, year] = cleanedLines[dateIndex].split('-');
            billData.date = new Date(`${year}-${month}-${day}`);
        }
        else {
            billData.date = new Date();
        }
        const nameIndex = dateIndex !== -1 ? dateIndex + 1 : 0;
        if (nameIndex < cleanedLines.length && !cleanedLines[nameIndex].startsWith("TIME:") &&
            !cleanedLines[nameIndex].match(/^\d{10}$/)) {
            billData.customerName = cleanedLines[nameIndex];
        }
        const phoneIndex = cleanedLines.findIndex((line) => line.match(/^\d{10}$/));
        if (phoneIndex !== -1) {
            billData.customerPhone = cleanedLines[phoneIndex];
        }
        const paymentIndex = cleanedLines.findIndex((line) => line.includes("BILL"));
        if (paymentIndex !== -1) {
            billData.paymentType = cleanedLines[paymentIndex].toLowerCase().includes("cash") ? "cash" : cleanedLines[paymentIndex];
        }
        if (paymentIndex !== -1 && paymentIndex + 1 < cleanedLines.length) {
            billData.storeName = cleanedLines[paymentIndex + 1];
            if (paymentIndex + 2 < cleanedLines.length) {
                billData.storeLocation = cleanedLines[paymentIndex + 2];
            }
        }
        const storePhoneIndex = cleanedLines.findIndex((line, index) => line.match(/^\d{10}$/) && index > phoneIndex && line !== billData.customerPhone);
        if (storePhoneIndex !== -1) {
            billData.storePhone = cleanedLines[storePhoneIndex];
        }
        const amountTextIndex = cleanedLines.findIndex((line) => (line.startsWith("Rs.") || line.startsWith("₹")) && line.includes("Only"));
        if (amountTextIndex !== -1) {
            billData.amountText = cleanedLines[amountTextIndex];
            const totalAmountIndex = amountTextIndex + 1;
            const discountIndex = amountTextIndex + 2;
            const finalAmountIndex = amountTextIndex + 3;
            if (totalAmountIndex < cleanedLines.length &&
                cleanedLines[totalAmountIndex].match(/^\d+\.\d{2}$/)) {
                billData.calculatedAmount = parseFloat(cleanedLines[totalAmountIndex]);
            }
            if (discountIndex < cleanedLines.length &&
                cleanedLines[discountIndex].match(/^\d+\.\d{2}$/)) {
                billData.netDiscount = parseFloat(cleanedLines[discountIndex]);
                billData.creditAmount = parseFloat(cleanedLines[discountIndex]);
            }
            if (finalAmountIndex < cleanedLines.length &&
                cleanedLines[finalAmountIndex].match(/^\d+\.\d{2}$/)) {
                billData.amountPaid = billData.calculatedAmount;
            }
        }
        const medicineItems = [];
        const itemStartIndices = [];
        cleanedLines.forEach((line, index) => {
            if ((line.match(/^[1-9]$/) || line.match(/^[1-9]:[0-9]$/)) &&
                index < cleanedLines.length - 5) {
                itemStartIndices.push(index);
            }
        });
        for (let i = 0; i < itemStartIndices.length; i++) {
            const startIndex = itemStartIndices[i];
            const endIndex = i < itemStartIndices.length - 1
                ? itemStartIndices[i + 1]
                : cleanedLines.length;
            const itemLines = cleanedLines.slice(startIndex, endIndex);
            if (itemLines.length < 6)
                continue;
            const quantity = parseInt(itemLines[0]);
            if (isNaN(quantity))
                continue;
            const itemName = itemLines[1];
            const batchIndex = itemLines.findIndex((line, idx) => idx > 1 && line.match(/^\d+$/));
            if (batchIndex === -1)
                continue;
            const expiryIndex = itemLines.findIndex((line, idx) => idx > batchIndex && line.match(/^\d{1,2}\/\d{2,4}$/));
            if (expiryIndex === -1)
                continue;
            const mrpIndex = itemLines.findIndex((line, idx) => idx > expiryIndex && line.match(/^\d+\.\d{2}$/));
            if (mrpIndex === -1)
                continue;
            const discountIndex = itemLines.findIndex((line, idx) => idx > mrpIndex && line.match(/^\d+(\.\d{2})?$/));
            if (discountIndex === -1)
                continue;
            const item = {
                quantity,
                item: itemName,
                batch: itemLines[batchIndex],
                expBatch: itemLines[expiryIndex],
                mrp: parseFloat(itemLines[mrpIndex]),
                discount: parseFloat(itemLines[discountIndex])
            };
            medicineItems.push(item);
        }
        if (medicineItems.length > 0) {
            billData.items = medicineItems;
        }
        console.log("Extracted items:", billData.items);
        let customer = await prisma.customer.findUnique({
            where: { phone: billData.customerPhone }
        });
        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    name: billData.customerName || "Unknown Customer",
                    phone: billData.customerPhone || `Unknown-${Date.now()}`,
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
                    storeName: billData.storeName,
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
                netDiscount: billData.netDiscount || 0,
                netAmount: 0,
                amountPaid: billData.calculatedAmount || 0,
                creditAmount: billData.netDiscount || 0,
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