import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";


export async function postDailyBills(req: Request, res: Response): Promise<void> {
  const prisma = new PrismaClient();
  const { bill } = req.body;

  try {
    // validate body
    if (!bill) {
      console.log("Invalid request body", bill);
     res.status(400).json({ error: "Invalid request body" });
      return;
    }

    console.log("Creating bill", bill);
    
    // Parse the log data
    const lines = bill.split('\n');
    const billData: any = {
      items: []
    };

    let currentItem: any = {};
    let isItemSection = false;
    let lineIndex = 0;
    
    // Extract bill number from the first meaningful line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const actualLine = line.replace(/^Apr \d+ \d+:\d+:\d+ [AP]M/, '').trim();
      
      if (actualLine && /\/\d+$/.test(actualLine)) {
        billData.billNo = actualLine;
        lineIndex = i + 1;
        break;
      }
    }
    
    // Process remaining lines
    for (let i = lineIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      const actualLine = line.replace(/^Apr \d+ \d+:\d+:\d+ [AP]M/, '').trim();
      if (!actualLine) continue;
      
      // Extract date
      if (actualLine.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const [day, month, year] = actualLine.split('-');
        billData.date = new Date(`${year}-${month}-${day}`);
        continue;
      }
      
      // Extract customer name (assuming it appears early in the log)
      if (!billData.customerName && actualLine && !actualLine.includes("TIME:") && !actualLine.match(/^\d+$/)) {
        billData.customerName = actualLine;
        continue;
      }
      
      // Extract customer phone (10 digit number)
      if (actualLine.match(/^\d{10}$/) && !billData.customerPhone) {
        billData.customerPhone = actualLine;
        continue;
      }
      
      // Extract payment type
      if (actualLine.includes("BILL")) {
        billData.paymentType = actualLine.toLowerCase().includes("cash") ? "cash" : actualLine;
        continue;
      }
      
      // Extract store name (assuming it comes after customer info)
      if (!billData.storeName && billData.customerName && actualLine && !actualLine.match(/^\d+$/)) {
        billData.storeName = actualLine;
        continue;
      }
      
      // Extract store location (assuming it comes after store name)
      if (billData.storeName && !billData.storeLocation && actualLine && !actualLine.match(/^\d+$/)) {
        billData.storeLocation = actualLine;
        continue;
      }
      
      // Extract store phone (assuming it's another 10-digit number after customer phone)
      if (actualLine.match(/^\d{10}$/) && billData.customerPhone && !billData.storePhone && actualLine !== billData.customerPhone) {
        billData.storePhone = actualLine;
        continue;
      }
      
      // Look for amounts at the end of the log
      // Find lines with currency values
      if (actualLine.match(/^Rs\.|^₹/) && actualLine.includes("Only")) {
        billData.amountText = actualLine;
        
        // The next few lines should contain numerical values
        let amountCount = 0;
        for (let j = i + 1; j < i + 5 && j < lines.length; j++) {
          const amountLine = lines[j].trim();
          const actualAmountLine = amountLine.replace(/^Apr \d+ \d+:\d+:\d+ [AP]M/, '').trim();
          
          if (actualAmountLine.match(/^\d+\.\d{2}$/)) {
            const amount = parseFloat(actualAmountLine);
            amountCount++;
            
            if (amountCount === 1) {
              // First amount is netAmount (but we won't use it as per requirement)
              billData.calculatedAmount = amount;
            } else if (amountCount === 2) {
              // Second amount is discount - put in both netDiscount and creditAmount
              billData.netDiscount = amount;
              billData.creditAmount = amount;
            } else if (amountCount === 3) {
              // Third amount is the amountPaid
              billData.amountPaid = amount;
              break;
            }
          }
        }
        
        i += amountCount; // Skip the amount lines we've processed
        continue;
      }
      
      // Start capturing item details
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
          
          // Add item to list and reset for next item
          billData.items.push(currentItem);
          currentItem = {};
          
          // Look for next item quantity
          if (i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            const nextActualLine = nextLine.replace(/^Apr \d+ \d+:\d+:\d+ [AP]M/, '').trim();
            
            if (nextActualLine.match(/^\d+$/)) {
              currentItem = {
                quantity: parseInt(nextActualLine)
              };
              i++;
            } else if (nextActualLine.match(/^\d+:\d+$/)) {
              // This might be a ratio indicator, not an item
              isItemSection = false;
            }
          }
          
          continue;
        }
      }
    }
    
    // Find or create customer
    let customer = await prisma.customer.findUnique({
      where: { phone: billData.customerPhone }
    });
    
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: billData.customerName || "Unknown Customer",
          phone: billData.customerPhone || "0000000000", // Fallback for missing phone
          address: null,
        }
      });
    }
    
    // Find or create store
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
    
    // Create the bill
    const newBill = await prisma.bill.create({
      data: {
        billNo: billData.billNo || `UNKNOWN-${Date.now()}`,
        customerId: customer.id,
        storeId: store.id,
        date: billData.date || new Date(),
        netDiscount: billData.netDiscount || 0,
        netAmount: 0, // Not using this field as per requirement
        amountPaid: billData.amountPaid || 0,
        creditAmount: billData.creditAmount || 0,
        paymentType: billData.paymentType || "cash",
        isUploaded: true,
        billDetails: {
          create: billData.items.map((item: any) => ({
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
      parsedData: billData // Include for debugging/verification
    });
  } catch (error) {
    console.error("Error creating bill:", error);
    res.status(500).json({ 
      error: "Failed to create bill", 
      details: error instanceof Error ? error.message : "Unknown error"
    });
  } finally {
    await prisma.$disconnect();
  }
}