// src/controllers/upload.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import fs from 'fs';
import { Worker } from 'worker_threads';
import path from 'path';
import { broadcastProgress, broadcastCompletion } from "../utils/Websocket"; 

const prisma = new PrismaClient();

interface BillRecord {
  billNo: string;
  customerName: string;
  customerId?: number;
  date: Date;
  items: {
    name: string;
    quantity: number;
    batch: string;
    expBatch: string;
    mrp: number;
    discount: number;
  }[];
  totalAmount: number;
}

export const uploadExcelFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      console.error("No file uploaded.");
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Create an entry in the UploadHistory table with "in-progress" status
    const uploadHistory = await prisma.uploadHistory.create({
      data: {
        fileName,
        status: "in-progress",
      },
    });

    const workerPath = path.resolve(__dirname, "./excelProccessor.js");
    if (!fs.existsSync(workerPath)) {
      console.error(`Worker file does not exist at: ${workerPath}`);
      res.status(500).json({ error: "Worker file not found" });

      // Update the status to "failed" in the UploadHistory table
      await prisma.uploadHistory.update({
        where: { id: uploadHistory.id },
        data: { status: "failed" },
      });

      return;
    }

    const worker = new Worker(workerPath, {
      workerData: { filePath },
    });

    worker.on("message", async (message) => {
      if (message.status === "progress") {
        console.log(`Received progress update from worker: ${message.progress}%`); // Debug log
        broadcastProgress(message.progress);
      } else if (message.status === "completed") {
        // Update the status to "completed" in the UploadHistory table
        await prisma.uploadHistory.update({
          where: { id: uploadHistory.id },
          data: { status: "completed" },
        });

        broadcastCompletion("completed", message.stats);
        res.status(200).json({
          success: true,
          message: "File processed successfully",
          stats: message.stats || {},
        });
      } else if (message.status === "error") {
        // Update the status to "failed" in the UploadHistory table
        await prisma.uploadHistory.update({
          where: { id: uploadHistory.id },
          data: { status: "failed" },
        });

        broadcastCompletion("error", null, message.error);
        res.status(500).json({
          success: false,
          message: message.error,
        });
      }
    });

    worker.on("error", async (error) => {
      console.error("Worker error:", error);

      // Update the status to "failed" in the UploadHistory table
      await prisma.uploadHistory.update({
        where: { id: uploadHistory.id },
        data: { status: "failed" },
      });

      broadcastCompletion("error", null, error.message);
      res.status(500).json({
        success: false,
        message: "Error processing file",
      });
    });
    // Handle worker exit (unexpected termination)
    worker.on("exit", async (code) => {
      if (code !== 0) {
        console.error(`Worker exited with code ${code}. Marking upload as failed.`);

        // Update the status to "failed" in the UploadHistory table
        await prisma.uploadHistory.update({
          where: { id: uploadHistory.id },
          data: { status: "failed" },
        });

        broadcastCompletion("error", null, "Worker thread exited unexpectedly.");
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Error uploading file" });
  }
};

// For smaller files or if you don't want to use worker threads
export const processExcelFileSync = async (req: Request, res: Response): Promise<void> => {
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
    
    // Process the data
    const processedData = await processData(data);
    
    // Clean up the uploaded file
    fs.unlinkSync(req.file.path);

    res.status(200).json({ 
      message: 'File processed successfully', 
      recordsProcessed: processedData.length 
    });
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: 'Error processing file' });
  }
};

// Process data synchronously
async function processData(data: any[]) {
  console.log("Starting to process data...");
  const bills: BillRecord[] = [];
  const storeMap = new Map<string, number>();
  const customerMap = new Map<string, number>();
  
  // First pass: Extract bill records
  let currentBill: BillRecord | null = null;
  
  for (const row of data) {
    console.log("Processing row:", JSON.stringify(row));
    
    // Check if this row contains a bill number (new bill)
    // In your image, this would be the "BILL NO." field
    if ((row['BILL NO.'] || row.BILL_NO) && (typeof row['BILL NO.'] === 'string' || typeof row.BILL_NO === 'string')) {
      // Save previous bill if exists
      if (currentBill) {
        bills.push(currentBill);
      }
      
      // Extract bill number and customer name
      let billParts: string[] = [];
      if (row['BILL NO.']) {
        billParts = row['BILL NO.'].split(' ');
      } else if (row.BILL_NO) {
        billParts = row.BILL_NO.split(' ');
      }
      
      const billNo = billParts[0];
      const customerName = billParts.slice(1).join(' ');
      
      // Parse date (in your image, this is on a separate row)
      let date = new Date();
      if (row.DATE || row['DATE']) {
        const dateStr = row.DATE || row['DATE'];
        if (typeof dateStr === 'string') {
          const dateParts = dateStr.split('-');
          if (dateParts.length === 3) {
            date = new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
          } else {
            date = new Date(dateStr);
          }
        } else if (dateStr instanceof Date) {
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
    // Check if this is an item row (DESCRIPTION field)
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
    // Check if this is a total amount row
    else if (currentBill && (row['TOTAL AMOUNT :'] || row['TOTAL AMOUNT'] || row.TOTAL_AMOUNT)) {
      currentBill.totalAmount = parseFloat(
        row['TOTAL AMOUNT :'] || row['TOTAL AMOUNT'] || row.TOTAL_AMOUNT || 0
      );
      console.log(`Set total amount for bill ${currentBill.billNo}: ${currentBill.totalAmount}`);
    }
  }
  
  // Add the last bill if it exists
  if (currentBill) {
    bills.push(currentBill);
  }
  
  console.log(`Extracted ${bills.length} bill records`);
  
  // Second pass: Save to database
  const results: Array<{
    id: number;
    createdAt: Date;
    updatedAt: Date;
    billNo: string;
    customerId: number;
    storeId: number;
    date: Date;
    netDiscount: number;
    netAmount: number;
    amountPaid: number;
    creditAmount: number;
    paymentType: string;
    isUploaded: boolean;
  }> = [];
  
  for (const bill of bills) {
    try {
      // Get or create customer
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
      
      // Get or create store
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
      
      // Check if bill already exists
      const existingBill = await prisma.bill.findUnique({
        where: { billNo: bill.billNo }
      });
      
      if (existingBill) {
        console.log(`Bill ${bill.billNo} already exists, skipping`);
        results.push(existingBill);
        continue;
      }
      
      // Create the bill and its details in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const newBill = await tx.bill.create({
          data: {
            billNo: bill.billNo,
            customerId: customerId as number,
            storeId: storeId as number,
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
        
        // Create bill details
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
    } catch (error) {
      console.error(`Error processing bill ${bill.billNo}:`, error);
    }
  }
  
  console.log(`Saved ${results.length} bills to database`);
  return results;
}

// filepath: d:\Nexus\wekeyardashboard\server\src\controllers\uploadController.ts
export const getUploadHistory = async (_req: Request, res: Response): Promise<void> => {
  try {
    const history = await prisma.uploadHistory.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching upload history:", error);
    res.status(500).json({ error: "Failed to fetch upload history" });
  }
};

export const deleteUploadHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (id) {
      // Parse the ID as an integer
      const parsedId = parseInt(id, 10);

      if (isNaN(parsedId)) {
        res.status(400).json({ error: "Invalid ID format" });
        return;
      }

      // Delete a specific upload history record by ID
      const deletedRecord = await prisma.uploadHistory.delete({
        where: { id: parsedId },
      });

      res.status(200).json({ message: "Upload history record deleted successfully", deletedRecord });
    } else {
      // Delete all upload history records
      await prisma.uploadHistory.deleteMany();
      res.status(200).json({ message: "All upload history records deleted successfully" });
    }
  } catch (error) {
    console.error("Error deleting upload history:", error);
    res.status(500).json({ error: "Failed to delete upload history" });
  }
};

export const getUploadStatus = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error("Error fetching upload status:", error);
    res.status(500).json({ error: "Error fetching upload status" });
  }
};