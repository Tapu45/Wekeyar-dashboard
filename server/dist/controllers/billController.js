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
        let currentItem = {};
        let isItemSection = false;
        let lineIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const actualLine = line.replace(/^Apr \d+ \d+:\d+:\d+ [AP]M/, '').trim();
            if (actualLine && /\/\d+$/.test(actualLine)) {
                billData.billNo = actualLine;
                lineIndex = i + 1;
                break;
            }
        }
        for (let i = lineIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            const actualLine = line.replace(/^Apr \d+ \d+:\d+:\d+ [AP]M/, '').trim();
            if (!actualLine)
                continue;
            if (actualLine.match(/^\d{2}-\d{2}-\d{4}$/)) {
                const [day, month, year] = actualLine.split('-');
                billData.date = new Date(`${year}-${month}-${day}`);
                continue;
            }
            if (!billData.customerName && actualLine && !actualLine.includes("TIME:") && !actualLine.match(/^\d+$/)) {
                billData.customerName = actualLine;
                continue;
            }
            if (actualLine.match(/^\d{10}$/) && !billData.customerPhone) {
                billData.customerPhone = actualLine;
                continue;
            }
            if (actualLine.includes("BILL")) {
                billData.paymentType = actualLine.toLowerCase().includes("cash") ? "cash" : actualLine;
                continue;
            }
            if (!billData.storeName && billData.customerName && actualLine && !actualLine.match(/^\d+$/)) {
                billData.storeName = actualLine;
                continue;
            }
            if (billData.storeName && !billData.storeLocation && actualLine && !actualLine.match(/^\d+$/)) {
                billData.storeLocation = actualLine;
                continue;
            }
            if (actualLine.match(/^\d{10}$/) && billData.customerPhone && !billData.storePhone && actualLine !== billData.customerPhone) {
                billData.storePhone = actualLine;
                continue;
            }
            if (actualLine.match(/^Rs\.|^₹/) && actualLine.includes("Only")) {
                billData.amountText = actualLine;
                let amountCount = 0;
                for (let j = i + 1; j < i + 5 && j < lines.length; j++) {
                    const amountLine = lines[j].trim();
                    const actualAmountLine = amountLine.replace(/^Apr \d+ \d+:\d+:\d+ [AP]M/, '').trim();
                    if (actualAmountLine.match(/^\d+\.\d{2}$/)) {
                        const amount = parseFloat(actualAmountLine);
                        amountCount++;
                        if (amountCount === 1) {
                            billData.calculatedAmount = amount;
                        }
                        else if (amountCount === 2) {
                            billData.netDiscount = amount;
                            billData.creditAmount = amount;
                        }
                        else if (amountCount === 3) {
                            billData.amountPaid = amount;
                            break;
                        }
                    }
                }
                i += amountCount;
                continue;
            }
            if (actualLine.match(/^\d+$/) && !isItemSection && i > 10) {
                isItemSection = true;
                currentItem = {
                    quantity: parseInt(actualLine)
                };
                continue;
            }
            if (isItemSection) {
                if (!currentItem.item) {
                    currentItem.item = actualLine;
                    continue;
                }
                if (!currentItem.batch && actualLine.match(/^\d+$/)) {
                    currentItem.batch = actualLine;
                    continue;
                }
                if (currentItem.batch && !currentItem.expBatch && actualLine.match(/\d+\/\d+/)) {
                    currentItem.expBatch = actualLine;
                    continue;
                }
                if (currentItem.expBatch && !currentItem.mrp && actualLine.match(/^\d+\.\d{2}$/)) {
                    currentItem.mrp = parseFloat(actualLine);
                    continue;
                }
                if (currentItem.mrp && !currentItem.discount && actualLine.match(/^\d+\.\d{2}$|^\d+$/)) {
                    currentItem.discount = parseFloat(actualLine);
                    billData.items.push(currentItem);
                    currentItem = {};
                    if (i + 1 < lines.length) {
                        const nextLine = lines[i + 1].trim();
                        const nextActualLine = nextLine.replace(/^Apr \d+ \d+:\d+:\d+ [AP]M/, '').trim();
                        if (nextActualLine.match(/^\d+$/)) {
                            currentItem = {
                                quantity: parseInt(nextActualLine)
                            };
                            i++;
                        }
                        else if (nextActualLine.match(/^\d+:\d+$/)) {
                            isItemSection = false;
                        }
                    }
                    continue;
                }
            }
        }
        let customer = await prisma.customer.findUnique({
            where: { phone: billData.customerPhone }
        });
        if (!customer) {
            customer = await prisma.customer.create({
                data: {
                    name: billData.customerName || "Unknown Customer",
                    phone: billData.customerPhone || "0000000000",
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
        const newBill = await prisma.bill.create({
            data: {
                billNo: billData.billNo || `UNKNOWN-${Date.now()}`,
                customerId: customer.id,
                storeId: store.id,
                date: billData.date || new Date(),
                netDiscount: billData.netDiscount || 0,
                netAmount: 0,
                amountPaid: billData.amountPaid || 0,
                creditAmount: billData.creditAmount || 0,
                paymentType: billData.paymentType || "cash",
                isUploaded: true,
                billDetails: {
                    create: billData.items.map((item) => ({
                        item: item.item || "Unknown Item",
                        quantity: item.quantity || 1,
                        batch: item.batch || "",
                        expBatch: item.expBatch || "",
                        mrp: item.mrp || 0,
                        discount: item.discount || 0,
                    }))
                }
            }
        });
        res.status(200).json({
            success: true,
            message: `Bill ${billData.billNo} created successfully`,
            billId: newBill.id,
            parsedData: billData
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