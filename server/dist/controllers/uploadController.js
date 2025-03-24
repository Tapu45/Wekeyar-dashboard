"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUploadStatus = exports.deleteUploadHistory = exports.getUploadHistory = exports.processExcelFileSync = exports.uploadExcelFile = void 0;
const client_1 = require("@prisma/client");
const XLSX = __importStar(require("xlsx"));
const fs_1 = __importDefault(require("fs"));
const worker_threads_1 = require("worker_threads");
const path_1 = __importDefault(require("path"));
const Websocket_1 = require("../utils/Websocket");
const cloudinary_1 = __importDefault(require("../utils/cloudinary"));
const prisma = new client_1.PrismaClient();
const uploadExcelFile = async (req, res) => {
    try {
        if (!req.file) {
            console.error("No file uploaded.");
            res.status(400).json({ error: "No file uploaded" });
            return;
        }
        const file = req.file;
        const fileName = req.file.originalname;
        console.log("Uploading file to Cloudinary...");
        const cloudinaryResult = await new Promise((resolve, reject) => {
            const stream = cloudinary_1.default.uploader.upload_stream({ folder: "uploads", resource_type: "raw" }, (error, result) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(result);
                }
            });
            stream.end(file.buffer);
        });
        console.log("File uploaded to Cloudinary:", cloudinaryResult.secure_url);
        const uploadHistory = await prisma.uploadHistory.create({
            data: {
                fileName,
                fileUrl: cloudinaryResult.secure_url,
                status: "in-progress",
            },
        });
        const workerPath = path_1.default.resolve(__dirname, "./excelProccessor.js");
        if (!fs_1.default.existsSync(workerPath)) {
            console.error(`Worker file does not exist at: ${workerPath}`);
            res.status(500).json({ error: "Worker file not found" });
            await prisma.uploadHistory.update({
                where: { id: uploadHistory.id },
                data: { status: "failed" },
            });
            return;
        }
        const worker = new worker_threads_1.Worker(workerPath, {
            workerData: { fileUrl: cloudinaryResult.secure_url },
        });
        worker.on("message", async (message) => {
            if (message.status === "progress") {
                console.log(`Received progress update from worker: ${message.progress}%`);
                (0, Websocket_1.broadcastProgress)(message.progress);
            }
            else if (message.status === "completed") {
                await prisma.uploadHistory.update({
                    where: { id: uploadHistory.id },
                    data: { status: "completed" },
                });
                (0, Websocket_1.broadcastCompletion)("completed", message.stats);
                res.status(200).json({
                    success: true,
                    message: "File processed successfully",
                    stats: message.stats || {},
                });
            }
            else if (message.status === "error") {
                await prisma.uploadHistory.update({
                    where: { id: uploadHistory.id },
                    data: { status: "failed" },
                });
                (0, Websocket_1.broadcastCompletion)("error", null, message.error);
                res.status(500).json({
                    success: false,
                    message: message.error,
                });
            }
        });
        worker.on("error", async (error) => {
            console.error("Worker error:", error);
            await prisma.uploadHistory.update({
                where: { id: uploadHistory.id },
                data: { status: "failed" },
            });
            (0, Websocket_1.broadcastCompletion)("error", null, error.message);
            res.status(500).json({
                success: false,
                message: "Error processing file",
            });
        });
        worker.on("exit", async (code) => {
            if (code !== 0) {
                console.error(`Worker exited with code ${code}. Marking upload as failed.`);
                await prisma.uploadHistory.update({
                    where: { id: uploadHistory.id },
                    data: { status: "failed" },
                });
                (0, Websocket_1.broadcastCompletion)("error", null, "Worker thread exited unexpectedly.");
            }
        });
    }
    catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: "Error uploading file" });
    }
};
exports.uploadExcelFile = uploadExcelFile;
const processExcelFileSync = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        console.log(`Processing file synchronously: ${req.file.path}`);
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        console.log(`Parsed ${data.length} rows from Excel file`);
        const processedData = await processData(data);
        fs_1.default.unlinkSync(req.file.path);
        res.status(200).json({
            message: 'File processed successfully',
            recordsProcessed: processedData.length
        });
    }
    catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({ error: 'Error processing file' });
    }
};
exports.processExcelFileSync = processExcelFileSync;
async function processData(data) {
    console.log("Starting to process data...");
    const bills = [];
    const storeMap = new Map();
    const customerMap = new Map();
    let currentBill = null;
    for (const row of data) {
        console.log("Processing row:", JSON.stringify(row));
        if ((row['BILL NO.'] || row.BILL_NO) && (typeof row['BILL NO.'] === 'string' || typeof row.BILL_NO === 'string')) {
            if (currentBill) {
                bills.push(currentBill);
            }
            let billParts = [];
            if (row['BILL NO.']) {
                billParts = row['BILL NO.'].split(' ');
            }
            else if (row.BILL_NO) {
                billParts = row.BILL_NO.split(' ');
            }
            const billNo = billParts[0];
            const customerName = billParts.slice(1).join(' ');
            let date = new Date();
            if (row.DATE || row['DATE']) {
                const dateStr = row.DATE || row['DATE'];
                if (typeof dateStr === 'string') {
                    const dateParts = dateStr.split('-');
                    if (dateParts.length === 3) {
                        date = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
                    }
                    else {
                        date = new Date(dateStr);
                    }
                }
                else if (dateStr instanceof Date) {
                    date = dateStr;
                }
            }
            currentBill = {
                billNo,
                customerName,
                date,
                items: [],
                totalAmount: 0
            };
            console.log(`Created bill record: ${billNo} for ${customerName}`);
        }
        else if (currentBill && (row.DESCRIPTION || row['DESCRIPTION'])) {
            const description = row.DESCRIPTION || row['DESCRIPTION'];
            const qty = parseFloat(row.QTY || row['QTY'] || 1);
            const expBatch = row['EXP BATCH'] || row.EXP_BATCH || '';
            const cash = parseFloat(row.CASH || row['CASH'] || 0);
            currentBill.items.push({
                name: description,
                quantity: qty,
                batch: expBatch,
                expBatch,
                mrp: cash,
                discount: 0
            });
            console.log(`Added item to bill ${currentBill.billNo}: ${description}`);
        }
        else if (currentBill && (row['TOTAL AMOUNT :'] || row['TOTAL AMOUNT'] || row.TOTAL_AMOUNT)) {
            currentBill.totalAmount = parseFloat(row['TOTAL AMOUNT :'] || row['TOTAL AMOUNT'] || row.TOTAL_AMOUNT || 0);
            console.log(`Set total amount for bill ${currentBill.billNo}: ${currentBill.totalAmount}`);
        }
    }
    if (currentBill) {
        bills.push(currentBill);
    }
    console.log(`Extracted ${bills.length} bill records`);
    const results = [];
    for (const bill of bills) {
        try {
            let customerId = customerMap.get(bill.customerName);
            if (!customerId) {
                const phoneNumber = bill.customerName.replace(/\s/g, '') || `unknown-${Date.now()}`;
                const customer = await prisma.customer.upsert({
                    where: { phone: phoneNumber },
                    update: { name: bill.customerName },
                    create: {
                        name: bill.customerName,
                        phone: phoneNumber,
                        address: null
                    }
                });
                customerId = customer.id;
                customerMap.set(bill.customerName, customerId);
                console.log(`Created/found customer ${bill.customerName} with ID ${customerId}`);
            }
            let storeId = storeMap.get('WEKEYAR PLUS');
            if (!storeId) {
                const store = await prisma.store.upsert({
                    where: { storeName: 'WEKEYAR PLUS' },
                    update: {},
                    create: {
                        storeName: 'WEKEYAR PLUS',
                        address: 'AT.PLOT NO.210,DISTRICT CENTRE, PO.CHANDRASEKHARPUR, BHUBANESWAR,ODISHA. PIN CODE 751019'
                    }
                });
                storeId = store.id;
                storeMap.set('WEKEYAR PLUS', storeId);
                console.log(`Created/found store WEKEYAR PLUS with ID ${storeId}`);
            }
            const existingBill = await prisma.bill.findUnique({
                where: { billNo: bill.billNo }
            });
            if (existingBill) {
                console.log(`Bill ${bill.billNo} already exists, skipping`);
                results.push(existingBill);
                continue;
            }
            const result = await prisma.$transaction(async (tx) => {
                const newBill = await tx.bill.create({
                    data: {
                        billNo: bill.billNo,
                        customerId: customerId,
                        storeId: storeId,
                        date: bill.date,
                        netDiscount: 0,
                        netAmount: bill.totalAmount,
                        amountPaid: bill.totalAmount,
                        creditAmount: 0,
                        paymentType: 'CASH',
                        isUploaded: true
                    }
                });
                console.log(`Created bill ${bill.billNo} with ID ${newBill.id}`);
                for (const item of bill.items) {
                    await tx.billDetails.create({
                        data: {
                            billId: newBill.id,
                            item: item.name,
                            quantity: item.quantity,
                            batch: item.batch,
                            expBatch: item.expBatch,
                            mrp: item.mrp,
                            discount: item.discount
                        }
                    });
                }
                return newBill;
            });
            results.push(result);
            console.log(`Successfully processed bill ${bill.billNo}`);
        }
        catch (error) {
            console.error(`Error processing bill ${bill.billNo}:`, error);
        }
    }
    console.log(`Saved ${results.length} bills to database`);
    return results;
}
const getUploadHistory = async (_req, res) => {
    try {
        const history = await prisma.uploadHistory.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json(history);
    }
    catch (error) {
        console.error("Error fetching upload history:", error);
        res.status(500).json({ error: "Failed to fetch upload history" });
    }
};
exports.getUploadHistory = getUploadHistory;
const deleteUploadHistory = async (req, res) => {
    try {
        const { id } = req.params;
        if (id) {
            const parsedId = parseInt(id, 10);
            if (isNaN(parsedId)) {
                res.status(400).json({ error: "Invalid ID format" });
                return;
            }
            const deletedRecord = await prisma.uploadHistory.delete({
                where: { id: parsedId },
            });
            res.status(200).json({ message: "Upload history record deleted successfully", deletedRecord });
        }
        else {
            await prisma.uploadHistory.deleteMany();
            res.status(200).json({ message: "All upload history records deleted successfully" });
        }
    }
    catch (error) {
        console.error("Error deleting upload history:", error);
        res.status(500).json({ error: "Failed to delete upload history" });
    }
};
exports.deleteUploadHistory = deleteUploadHistory;
const getUploadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const uploadHistory = await prisma.uploadHistory.findUnique({
            where: { id: parseInt(id, 10) },
        });
        if (!uploadHistory) {
            res.status(404).json({ error: "Upload not found" });
            return;
        }
        res.status(200).json(uploadHistory);
    }
    catch (error) {
        console.error("Error fetching upload status:", error);
        res.status(500).json({ error: "Error fetching upload status" });
    }
};
exports.getUploadStatus = getUploadStatus;
//# sourceMappingURL=uploadController.js.map