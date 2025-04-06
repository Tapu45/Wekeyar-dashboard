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

    // Clean up log timestamps from each line
    const cleanedLines = lines.map((line: string) => {
      return line.replace(/^Apr \d+ \d+:\d+:\d+ [AP]M/, '').trim();
    }).filter((line: string) => line !== '');

    // Extract bill number
    for (let i = 0; i < cleanedLines.length; i++) {
      const line = cleanedLines[i];
      
      if (line.includes("Creating bill")) {
        billData.billNo = line.replace("Creating bill", "").trim();
        break;
      } else if (line && /\/\d+$/.test(line)) {
        billData.billNo = line;
        break;
      }
    }
    
    // Extract date - look for DD-MM-YYYY format
    const dateIndex = cleanedLines.findIndex((line: string) => line.match(/^\d{2}-\d{2}-\d{4}$/));
    if (dateIndex !== -1) {
      const [day, month, year] = cleanedLines[dateIndex].split('-');
      billData.date = new Date(`${year}-${month}-${day}`);
    } else {
      billData.date = new Date();
    }
    
    // Extract customer name (usually after date)
    const nameIndex = dateIndex !== -1 ? dateIndex + 1 : 0;
    if (nameIndex < cleanedLines.length && !cleanedLines[nameIndex].startsWith("TIME:") && 
        !cleanedLines[nameIndex].match(/^\d{10}$/)) {
      billData.customerName = cleanedLines[nameIndex];
    }
    
    // Extract customer phone (10 digit number)
    const phoneIndex = cleanedLines.findIndex((line: string) => line.match(/^\d{10}$/));
    if (phoneIndex !== -1) {
      billData.customerPhone = cleanedLines[phoneIndex];
    }
    
    // Extract payment type
    const paymentIndex = cleanedLines.findIndex((line: string | string[]) => line.includes("BILL"));
    if (paymentIndex !== -1) {
      billData.paymentType = cleanedLines[paymentIndex].toLowerCase().includes("cash") ? "cash" : cleanedLines[paymentIndex];
    }
    
    // Extract store name and location (after payment type)
    if (paymentIndex !== -1 && paymentIndex + 1 < cleanedLines.length) {
      billData.storeName = cleanedLines[paymentIndex + 1];
      
      if (paymentIndex + 2 < cleanedLines.length) {
        billData.storeLocation = cleanedLines[paymentIndex + 2];
      }
    }
    
    // Extract store phone (typically after store location)
    const storePhoneIndex = cleanedLines.findIndex((line: string, index: number) => 
      line.match(/^\d{10}$/) && index > phoneIndex && line !== billData.customerPhone
    );
    if (storePhoneIndex !== -1) {
      billData.storePhone = cleanedLines[storePhoneIndex];
    }
    
    // Find amount text (contains "Rs." and "Only")
    const amountTextIndex = cleanedLines.findIndex((line: string) => 
      (line.startsWith("Rs.") || line.startsWith("₹")) && line.includes("Only")
    );
    
    // Extract monetary values (they come after the amount text)
    if (amountTextIndex !== -1) {
      billData.amountText = cleanedLines[amountTextIndex];
      
      // The next few lines should contain the monetary values
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
        // Use calculatedAmount instead of finalAmount for amountPaid
        billData.amountPaid = billData.calculatedAmount;
      }
    }
    
    // Extract items - more robust item detection
    const medicineItems: any[] = [];
    
    // Find potential item starting points (quantities)
    const itemStartIndices: number[] = [];
    cleanedLines.forEach((line: string, index: number) => {
      // Items typically start with a single digit quantity (1-9)
      if ((line.match(/^[1-9]$/) || line.match(/^[1-9]:[0-9]$/)) && 
      index < cleanedLines.length - 5) {
        itemStartIndices.push(index);
      }
    });
    
    // Process each potential item
    for (let i = 0; i < itemStartIndices.length; i++) {
      const startIndex = itemStartIndices[i];
      const endIndex = i < itemStartIndices.length - 1 
        ? itemStartIndices[i + 1] 
        : cleanedLines.length;
      
      // Get all lines that might be part of this item
      const itemLines = cleanedLines.slice(startIndex, endIndex);
      
      // Basic validation - we need at least quantity, name, batch, expiry, MRP, discount
      if (itemLines.length < 6) continue;
      
      // Parse quantity
      const quantity = parseInt(itemLines[0]);
      if (isNaN(quantity)) continue;
      
      // Item name is typically the line after quantity
      const itemName = itemLines[1];
      
      // Find batch number (typically numeric)
      const batchIndex = itemLines.findIndex((line: string, idx: number) => 
        idx > 1 && line.match(/^\d+$/)
      );
      if (batchIndex === -1) continue;
      
      // Find expiry (typically in format MM/YY)
      const expiryIndex = itemLines.findIndex((line: string, idx: number) => 
        idx > batchIndex && line.match(/^\d{1,2}\/\d{2,4}$/)
      );
      if (expiryIndex === -1) continue;
      
      // Find MRP (decimal number)
      const mrpIndex = itemLines.findIndex((line: string, idx: number) => 
        idx > expiryIndex && line.match(/^\d+\.\d{2}$/)
      );
      if (mrpIndex === -1) continue;
      
      // Find discount (decimal or whole number)
      const discountIndex = itemLines.findIndex((line: string, idx: number) => 
        idx > mrpIndex && line.match(/^\d+(\.\d{2})?$/)
      );
      if (discountIndex === -1) continue;
      
      // Create item object
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
    
    // Update items array if we found any valid items
    if (medicineItems.length > 0) {
      billData.items = medicineItems;
    }
    
    // Debug log the extracted items
    console.log("Extracted items:", billData.items);
    
    // Find or create customer
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
    
    // Find or create store
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
    
    // Prepare bill details - verify item data format
    const billDetails = billData.items.map((item: any) => {
      return {
        item: item.item || "Unknown Item",
        quantity: item.quantity || 1,
        batch: item.batch || "",
        expBatch: item.expBatch || "",
        mrp: item.mrp || 0,
        discount: item.discount || 0,
      };
    });
    
    // Log billDetails being created
    console.log("Creating bill details:", billDetails);
    
    // Create the bill with nested bill details
    const newBill = await prisma.bill.create({
      data: {
        billNo: billData.billNo || `UNKNOWN-${Date.now()}`,
        customerId: customer.id,
        storeId: store.id,
        date: billData.date || new Date(),
        netDiscount: billData.netDiscount || 0,
        netAmount: 0, // Not using this field as per requirement
        amountPaid: billData.calculatedAmount || 0, // Use calculated amount (162.20)
        creditAmount: billData.netDiscount || 0, // Use netDiscount (32.44)
        paymentType: billData.paymentType || "cash",
        isUploaded: true,
        billDetails: {
          create: billDetails
        }
      },
      // Include the created bill details in the response
      include: {
        billDetails: true
      }
    });
    
    res.status(200).json({ 
      success: true, 
      message: `Bill ${billData.billNo} created successfully`,
      billId: newBill.id,
      parsedData: billData, // Include for debugging/verification
      billWithDetails: newBill // Include the full bill with details
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