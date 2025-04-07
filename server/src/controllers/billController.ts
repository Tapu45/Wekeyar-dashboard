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

    console.log("Processing bill", bill);
    
    // Parse the log data
    const lines = bill.split('\n');
    const billData: any = {
      items: []
    };

    // Clean up log timestamps from each line
    const cleanedLines = lines.map((line: string) => {
      return line.replace(/^Apr \d+ \d+:\d+:\d+ [AP]M/, '').trim();
    }).filter((line: string) => line !== '');

    // Extract bill number and type
    for (let i = 0; i < cleanedLines.length; i++) {
      const line = cleanedLines[i];
      
      if (line.includes("Creating bill")) {
        billData.billType = line.replace("Creating bill", "").trim();
      } else if (line.startsWith("Invoice No.") && i + 1 < cleanedLines.length) {
        // If line is "Invoice No." and next line is a colon, check the line after
        if (cleanedLines[i + 1] === ":" && i + 2 < cleanedLines.length) {
          billData.billNo = cleanedLines[i + 2];
          i += 2; // Skip the next two lines
        }
      } else if (line.match(/^BILL[A-Z0-9]+/) || line.match(/^[A-Z]+\d+/)) {
        // Look for patterns like BILLA0000
        billData.billNo = line.split("Date:")[0].trim();
        
        // Extract date if it's on the same line
        if (line.includes("Date:")) {
          const dateStr = line.split("Date:")[1].trim();
          if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
            const [day, month, year] = dateStr.split('-');
            billData.date = new Date(`${year}-${month}-${day}`);
          }
        }
      }
    }
    
    // Extract store name and location
    const storeNameIndex = cleanedLines.findIndex((line: string) => 
      !line.includes("Creating bill") && line.match(/^[A-Z\s]+$/) && line.length > 5
    );
    
    if (storeNameIndex !== -1) {
      billData.storeName = cleanedLines[storeNameIndex];
      
      // Store location is typically in the next few lines
      for (let i = storeNameIndex + 1; i < storeNameIndex + 4 && i < cleanedLines.length; i++) {
        if (cleanedLines[i] && !cleanedLines[i].startsWith("Phone :") && !cleanedLines[i].startsWith("Website :")) {
          billData.storeLocation = (billData.storeLocation || "") + 
            (billData.storeLocation ? " " : "") + cleanedLines[i];
        }
      }
    }
    
    // Extract store phone
    const phoneLineIndex = cleanedLines.findIndex((line: string) => line.startsWith("Phone :"));
    if (phoneLineIndex !== -1) {
      const phoneMatch = cleanedLines[phoneLineIndex].match(/\d{10}/);
      if (phoneMatch) {
        billData.storePhone = phoneMatch[0];
      }
    }
    
    // Extract customer name
    const patientNameIndex = cleanedLines.findIndex((line: string) => line.startsWith("Patient Name :"));
    if (patientNameIndex !== -1 && patientNameIndex + 1 < cleanedLines.length) {
      // Check if there's content after the colon on the same line
      const nameParts = cleanedLines[patientNameIndex].split(":");
      if (nameParts.length > 1 && nameParts[1].trim()) {
        billData.customerName = nameParts[1].trim();
      } 
      // Otherwise, customer name might be on the next line if it's not a label
      else if (!cleanedLines[patientNameIndex + 1].includes(":")) {
        billData.customerName = cleanedLines[patientNameIndex + 1];
      }
    }
    
    // Use a generic customer phone if not found
    billData.customerPhone = "9999999999"; // Default phone number if not found
    
    // Parse items - for GST invoice format
    // Look for table headers first
    const tableHeaderIndex = cleanedLines.findIndex((line: string | string[]) => 
      line.includes("PRODUCT NAME") && line.includes("BATCH") && line.includes("MRP")
    );
    
    if (tableHeaderIndex !== -1) {
      let i = tableHeaderIndex + 1;
      
      while (i < cleanedLines.length) {
        // Look for lines that start with a number followed by a period (e.g., "1.")
        if (cleanedLines[i].match(/^\d+\./)) {
          // const itemNumber = parseInt(cleanedLines[i].replace(".", ""));
          
          // Next line should be the product name
          const productName = i + 1 < cleanedLines.length ? cleanedLines[i + 1] : "";
          
          // Following lines should contain pack, HSN, batch, exp, qty, mrp, rate, taxes, amount
          let j = i + 2;
          let packSize = "";
          let batch = "";
          let expiry = "";
          let quantity = 0;
          let mrp = 0;
          let amount = 0;
          
          // Parse numerical values
          while (j < cleanedLines.length && !cleanedLines[j].match(/^\d+\./) && !cleanedLines[j].includes("SUB TOTAL")) {
            const line = cleanedLines[j];
            
            // Try to identify what this line contains based on the value format
            if (line.match(/^\d+$/)) {
              // Could be pack size, quantity, or batch number
              if (!packSize) {
                packSize = line;
              } else if (!quantity) {
                quantity = parseInt(line);
              } else if (!batch) {
                batch = line;
              }
            } 
            else if (line.match(/^\d+\.\d{2}$/)) {
              // Monetary values with decimal points
              if (!mrp) {
                mrp = parseFloat(line);
              } else if (!amount && parseFloat(line) > 100) {
                // Assume larger values are the amount
                amount = parseFloat(line);
              }
            }
            
            j++;
          }
          
          // If we found an amount but not quantity, assume quantity is 1
          if (amount > 0 && !quantity) {
            quantity = 1;
          }
          
          // Add the item if we have at least product name and amount
          if (productName && amount > 0) {
            billData.items.push({
              item: productName,
              quantity: quantity || 1,
              batch: batch || "",
              expBatch: expiry || "",
              mrp: mrp || amount,
              discount: 0 // No discount information in this format
            });
          }
          
          // Move to the next item or exit if we hit the subtotal
          if (j < cleanedLines.length && cleanedLines[j].includes("SUB TOTAL")) {
            break;
          }
          
          i = j;
        } else {
          i++;
        }
      }
    }
    
    // Extract total amount
    const grandTotalIndex = cleanedLines.findIndex((line: string) => line === "GRAND TOTAL");
    if (grandTotalIndex !== -1 && grandTotalIndex + 1 < cleanedLines.length) {
      const totalLine = cleanedLines[grandTotalIndex + 1];
      if (totalLine.match(/^\d+\.\d{2}$/)) {
        billData.calculatedAmount = parseFloat(totalLine);
      }
    } else {
      // Alternative: look for SUB TOTAL
      const subTotalIndex = cleanedLines.findIndex((line: string) => line === "SUB TOTAL");
      if (subTotalIndex !== -1 && subTotalIndex + 1 < cleanedLines.length) {
        const totalLine = cleanedLines[subTotalIndex + 1];
        if (totalLine.match(/^\d+\.\d{2}$/)) {
          billData.calculatedAmount = parseFloat(totalLine);
        }
      }
    }
    
    // Extract amount in words
    const amountTextIndex = cleanedLines.findIndex((line: string) => line.startsWith("Rs."));
    if (amountTextIndex !== -1) {
      billData.amountText = cleanedLines[amountTextIndex];
    }
    
    // Set payment type to cash by default for GST invoices
    billData.paymentType = "cash";
    
    // Debug log the extracted data
    console.log("Extracted data:", billData);
    console.log("Extracted items:", billData.items);
    
    // Find or create customer - use default phone if none found
    let customer = await prisma.customer.findUnique({
      where: { phone: billData.customerPhone }
    });
    
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: billData.customerName || "Unknown Customer",
          phone: billData.customerPhone, // Using default phone number
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
        netDiscount: 0, // GST invoices typically don't have discounts
        netAmount: 0, // Not using this field as per requirement
        amountPaid: billData.calculatedAmount || 0,
        creditAmount: 0, // No credit for GST invoice
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