import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

export async function postDailyBills(req: Request, res: Response): Promise<Response> {
  const prisma = new PrismaClient();
  const { bill } = req.body;

  try {
    // validate body
    if (!bill) {
      console.log("Invalid request body", bill);
      return res.status(400).json({ error: "Invalid request body" });
    }

    console.log("Processing bill input");
    
    // Split into individual bills if multiple exist
    // Look for "Creating bill" as a bill separator
    const billSegments = bill.split(/Apr \d+ \d+:\d+:\d+ PMCreating bill/);
    
    // If no segments were created, process the whole text as one bill
    const billsToProcess = billSegments.length > 1 
      ? billSegments.map((segment: string, index: number) => 
          index === 0 ? segment : "Creating bill" + segment)
      : [bill];
    
    const processedBills = [];
    const failedBills = [];
    
    for (const billText of billsToProcess) {
      if (!billText.trim()) continue;
      
      try {
        // Parse the log data
        const lines = billText.split('\n');
        const billData: any = {
          items: []
        };

        // Clean up log timestamps from each line
        const cleanedLines = lines.map((line: string) => {
          return line.replace(/^Apr \d+ \d+:\d+:\d+ [AP]M/, '').trim();
        }).filter((line: string) => line !== '');

        // Early validation to check if this is a weekly report or other non-bill format
        // Check for indicators that this is not a regular bill
        const isNonBillFormat = cleanedLines.some((line: string | string[]) => 
          line.includes("Weekly Sale Report") || 
          line.includes("SALE REPORT") ||
          line.includes("TOTAL NET SALE") ||
          (line.includes("SALE") && line.includes("RETURN") && line.includes("NET SALE"))
        );

        if (isNonBillFormat) {
          // Skip processing non-bill formats
          console.log("Detected non-bill format, skipping");
          failedBills.push({
            error: "Non-bill format detected",
            billText: billText.substring(0, 100) + "..."
          });
          continue; // Skip to the next bill
        }

        // Extract bill number
        for (let i = 0; i < cleanedLines.length; i++) {
          const line = cleanedLines[i];
          
          if (line.includes("Creating bill")) {
            billData.billNo = line.replace("Creating bill", "").trim();
            break;
          } else if (line.match(/^[A-Z]{2}\d+$/)) {
            // Match bill numbers like CN00007
            billData.billNo = line;
            break;
          } else if (line && /^[A-Z]+\/\d+$/.test(line)) {
            // Match bill numbers like RUCH/0393
            billData.billNo = line;
            break;
          }
        }
        
        if (billData.billNo && billData.billNo.startsWith("CN")) {
          billData.isReturnBill = true;
        } else {
          billData.isReturnBill = false;
        }
        
        // Extract date - look for DD-MM-YYYY format
        const dateIndex = cleanedLines.findIndex((line: string) => line.match(/^\d{2}-\d{2}-\d{4}$/));
        if (dateIndex !== -1) {
          const [day, month, year] = cleanedLines[dateIndex].split('-');
          billData.date = new Date(`${year}-${month}-${day}`);
        } else {
          billData.date = new Date();
        }
        
        // Find "CASH BILL" or similar payment identifier
        const paymentIndex = cleanedLines.findIndex((line: string) => 
          line.includes("BILL") && (line.includes("CASH") || line.includes("CREDIT"))
        );
        
        // Extract customer information - improved extraction to avoid misinterpretation
        billData.customerName = null;
        billData.customerPhone = null;

        if (paymentIndex > 0 && paymentIndex < cleanedLines.length) {
          // First look for phone number (10 digits) before the payment line
          for (let i = 0; i < paymentIndex; i++) {
            if (cleanedLines[i].match(/^\d{10}$/)) {
              billData.customerPhone = cleanedLines[i];
              
              // Find the customer name - check lines before the phone number
              for (let j = i - 1; j >= 0; j--) {
                const line = cleanedLines[j];
                // Skip lines with specific formats (date, time, etc.)
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
          
          // If no phone found but there's a line that looks like a name after the date
          // and before payment, use that as customer name
          if (!billData.customerName && dateIndex !== -1) {
            // Look for lines after the date and before any TIME: line
            for (let i = dateIndex + 1; i < paymentIndex; i++) {
              const line = cleanedLines[i];
              // Skip lines that are clearly not names
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
        
        // Extract store information - improved to handle doctor names correctly
        billData.storeName = null;
        billData.storeLocation = null;
        billData.storePhone = null;
        
        if (paymentIndex !== -1) {
          // Extract potential store information lines
          const potentialStoreLines: string[] = [];
          for (let i = paymentIndex + 1; i < cleanedLines.length; i++) {
            const line = cleanedLines[i];
            if (line && line.length > 2 && !line.match(/^\d+(\.\d{2})?$/)) {
              potentialStoreLines.push(line);
            }
            
            // Break after we've found store info or reached the limit of lines to check
            if (potentialStoreLines.length >= 4 || i > paymentIndex + 5) break;
          }
          
          // Process store information
          if (potentialStoreLines.length > 0) {
            // Find RUCHIKA or similar store names
            for (let i = 0; i < potentialStoreLines.length; i++) {
              const line = potentialStoreLines[i];
              
              // If a line starts with "DR." or similar, it's likely a doctor name, not a store name
              const isDoctorName = line.match(/^DR\.?\s/i);
              
              if (!isDoctorName) {
                billData.storeName = line;
                
                // If there's a line after this, check if it's a location
                if (i + 1 < potentialStoreLines.length) {
                  billData.storeLocation = potentialStoreLines[i + 1];
                  
                  // If there's another line after the location, check if it's a phone number
                  if (i + 2 < potentialStoreLines.length && 
                      potentialStoreLines[i + 2].match(/^\d{10}$/)) {
                    billData.storePhone = potentialStoreLines[i + 2];
                  }
                }
                break; // Found store info, stop processing
              }
            }
            
            // If still no store name but we found a doctor name followed by a store name
            if (!billData.storeName) {
              for (let i = 0; i < potentialStoreLines.length - 1; i++) {
                const line = potentialStoreLines[i];
                const nextLine = potentialStoreLines[i + 1];
                
                const isDoctorName = line.match(/^DR\.?\s/i);
                if (isDoctorName && nextLine) {
                  billData.storeName = nextLine; // The line after DR. is likely the store name
                  
                  // If there's a line after this, check if it's a location
                  if (i + 2 < potentialStoreLines.length) {
                    billData.storeLocation = potentialStoreLines[i + 2];
                    
                    // If there's another line after the location, check if it's a phone number
                    if (i + 3 < potentialStoreLines.length && 
                        potentialStoreLines[i + 3].match(/^\d{10}$/)) {
                      billData.storePhone = potentialStoreLines[i + 3];
                    }
                  }
                  break; // Found store info, stop processing
                }
              }
            }
          }
        }
        
        // Extract payment type
        if (paymentIndex !== -1) {
          billData.paymentType = cleanedLines[paymentIndex].toLowerCase().includes("cash") ? "cash" : "credit";
        }
        
        // Find "Rs." amount text line
        const amountTextIndex = cleanedLines.findIndex((line: string) => 
          line.startsWith("Rs.") && line.includes("Only")
        );
        
        // Extract monetary values
        if (amountTextIndex !== -1) {
          billData.amountText = cleanedLines[amountTextIndex];
          
          // Find the index of "Our Software" or similar line
          const softwareLineIndex = cleanedLines.findIndex((line: string) => 
            line.toLowerCase().includes("our software") || 
            line.toLowerCase().includes("software") ||
            line.toLowerCase().includes("marg erp")
          );
          
          if (softwareLineIndex !== -1) {
            // Look for the last decimal amount before the software line
            for (let i = softwareLineIndex - 1; i >= Math.max(0, amountTextIndex - 3); i--) {
              const line = cleanedLines[i];
              
              // Match decimal amounts (e.g., 239.00)
              if (line.match(/^\d+\.\d{2}$/)) {
                billData.amountPaid = parseFloat(line);
                break; // Found the amount paid
              }
            }
          }
          
          // In case we couldn't find the software line or amount paid
          if (!billData.amountPaid) {
            // Process all decimal values around the amount text line
            let decimalValues: number[] = [];
            
            for (let i = Math.max(0, amountTextIndex - 3); i < Math.min(cleanedLines.length, amountTextIndex + 4); i++) {
              const line = cleanedLines[i];
              
              // Match decimal amounts (e.g., 239.00)
              if (line.match(/^\d+\.\d{2}$/)) {
                decimalValues.push(parseFloat(line));
              }
            }
            
            // Assign values based on the values found (largest is typically MRP, smallest might be discount)
            if (decimalValues.length >= 3) {
              decimalValues.sort((a, b) => a - b);
              billData.calculatedAmount = decimalValues[1]; // Middle value
              billData.netDiscount = decimalValues[0];     // Smallest value
              billData.amountPaid = decimalValues[2];      // Largest value
            } else if (decimalValues.length > 0) {
              // If we only have one or two values, use the last one as amount paid
              billData.amountPaid = decimalValues[decimalValues.length - 1];
            }
          }
        }
        
        // Extract items - more robust algorithm
        const medicineItems: any[] = [];
        let itemStartIndices: number[] = [];
        
        // Find all potential item starts
        // Items typically begin with a single digit or digit:digit format
        cleanedLines.forEach((line: string, index: number) => {
          if ((line.match(/^[1-9]$/) || line.match(/^[1-9]:[0-9]$/)) && index < cleanedLines.length - 5) {
            itemStartIndices.push(index);
          }
        });
        
        // If no item starts were found with the above pattern, try more patterns
        if (itemStartIndices.length === 0) {
          cleanedLines.forEach((line: string, index: number) => {
            // Look for lines that are just numbers followed by product names
            if (line.match(/^[1-9]\d*$/) && 
                index + 1 < cleanedLines.length && 
                !cleanedLines[index + 1].match(/^\d+(\.\d{2})?$/)) {
              itemStartIndices.push(index);
            }
          });
        }
        
        // Process each potential item
        for (let i = 0; i < itemStartIndices.length; i++) {
          const startIndex = itemStartIndices[i];
          const endIndex = i < itemStartIndices.length - 1 
            ? itemStartIndices[i + 1] 
            : Math.min(cleanedLines.length, startIndex + 15); // Limit item size
          
          // Get all lines that might be part of this item
          const itemLines = cleanedLines.slice(startIndex, endIndex);
          
          // Basic validation - we need at least a few lines
          if (itemLines.length < 4) continue;
          
          // Extract quantity
          let quantity = parseInt(itemLines[0]);
          if (isNaN(quantity)) {
            // Try to extract from format like "1:0"
            const parts = itemLines[0].split(':');
            if (parts.length === 2) {
              quantity = parseInt(parts[0]);
            }
            
            if (isNaN(quantity)) continue;
          }
          
          // Item name is the line after quantity
          const itemName = itemLines[1];
          
          // Look for patterns in the item details
          let batch = "";
          let expBatch = "";
          let mrp = 0;
          let discount = 0;
          
          // Find batch number (typically numeric)
          for (let j = 2; j < itemLines.length; j++) {
            const line = itemLines[j];
            
            // Match batch number (digits only)
            if (!batch && line.match(/^\d+$/)) {
              batch = line;
              continue;
            }
            
            // Match expiry date (MM/YY format)
            if (batch && !expBatch && line.match(/^\d{1,2}\/\d{2,4}$/)) {
              expBatch = line;
              continue;
            }
            
            // Match MRP (decimal number)
            if (expBatch && line.match(/^\d+\.\d{2}$/)) {
              // If we already have MRP, this might be discount
              if (mrp === 0) {
                mrp = parseFloat(line);
              } else if (discount === 0) {
                discount = parseFloat(line);
                break; // Found all needed item data
              }
            }
          }
          
          // Only add item if we have all required fields
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
        
        // Update items array if we found any valid items
        if (medicineItems.length > 0) {
          billData.items = medicineItems;
        }
        
        // DEBUG: Only log the extracted bill data once
        console.log("Extracted bill data:", JSON.stringify(billData, null, 2));
        
        // FIX: Default store name if missing to avoid continuous validation errors
        if (!billData.storeName) {
          billData.storeName = "Unknown Store";
          console.log("Store name missing, using default 'Unknown Store'");
        }
        
        // Enhanced validation - Skip bills with invalid data
        // Log errors only once per bill
        if (!billData.billNo || !billData.date || isNaN(billData.date.getTime())) {
          console.log("Invalid bill data: Missing essential bill information");
          failedBills.push({
            error: "Missing essential bill information (bill number or date)",
            billData
          });
          continue; // Skip to the next bill
        }
        
        // Find or create customer - using upsert to avoid duplicates
        let customer;
        
        // Determine if we have valid customer information
        const hasCustomerName = billData.customerName && billData.customerName.trim() !== '';
        const hasCustomerPhone = billData.customerPhone && billData.customerPhone.trim() !== '';

        // Handle all possible scenarios
        if (hasCustomerName && hasCustomerPhone) {
          // Case 1: Both name and phone provided
          customer = await prisma.customer.upsert({
            where: { phone: billData.customerPhone },
            update: {
              name: billData.customerName,
              // Only update address if provided
              ...(billData.customerAddress && { address: billData.customerAddress })
            },
            create: {
              name: billData.customerName,
              phone: billData.customerPhone,
              address: null,
            }
          });
        } else if (hasCustomerName && !hasCustomerPhone) {
          // Case 2: Name provided but phone not provided - use "9999999999"
          customer = await prisma.customer.upsert({
            where: { phone: "9999999999" },
            update: {
              name: billData.customerName,
              // Only update address if provided
              ...(billData.customerAddress && { address: billData.customerAddress })
            },
            create: {
              name: billData.customerName,
              phone: "9999999999",
              address: null,
            }
          });
        } else if (!hasCustomerName && hasCustomerPhone) {
          // Case 3: Phone provided but name not provided - use "Unknown Customer"
          customer = await prisma.customer.upsert({
            where: { phone: billData.customerPhone },
            update: {
              name: "Unknown Customer",
              // Only update address if provided
              ...(billData.customerAddress && { address: billData.customerAddress })
            },
            create: {
              name: "Unknown Customer",
              phone: billData.customerPhone,
              address: null,
            }
          });
        } else {
          // Case 4: Both name and phone missing - use "Cashlist Customer" and "9999999999"
          customer = await prisma.customer.upsert({
            where: { phone: "9999999999" },
            update: {
              name: "Cashlist Customer",
              // Only update address if provided
              ...(billData.customerAddress && { address: billData.customerAddress })
            },
            create: {
              name: "Cashlist Customer",
              phone: "9999999999",
              address: null,
            }
          });
        }
        
        // Find or create store - using upsert to avoid duplicates
        let store;
        
        try {
          store = await prisma.store.upsert({
            where: { storeName: billData.storeName },
            update: {
              // Only update if new data is provided
              ...(billData.storeLocation && { address: billData.storeLocation }),
              ...(billData.storePhone && { phone: billData.storePhone })
            },
            create: {
              storeName: billData.storeName,
              address: billData.storeLocation || null,
              phone: billData.storePhone || null,
            }
          });
        } catch (error) {
          console.log("Store creation error:", error instanceof Error ? error.message : "Unknown error");
          failedBills.push({
            error: `Store creation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            billData
          });
          continue; // Skip to next bill
        }
        
        // Prepare bill details
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
        
        // Check if bill already exists
        const existingBill = await prisma.bill.findUnique({
          where: { billNo: billData.billNo }
        });
        
        if (existingBill) {
          // Skip bills that already exist
          console.log(`Bill with number ${billData.billNo} already exists`);
          failedBills.push({
            error: "Bill already exists",
            billNo: billData.billNo
          });
          continue; // Skip to next bill
        }
        
        // Create the bill with nested bill details
        const newBill = await prisma.bill.create({
          data: {
            billNo: billData.billNo,
            customerId: customer.id,
            storeId: store.id,
            date: billData.date,
            netDiscount: billData.netDiscount || 0,
            netAmount: 0, // Not using this field as per requirement
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
        
      } catch (error) {
        // Log the error and add to failed bills
        console.log("Failed bill:", error instanceof Error ? error.message : "Unknown error");
        failedBills.push({
          error: error instanceof Error ? error.message : "Unknown error",
          billText: billText.substring(0, 100) + "..." // Include part of the bill text for debugging
        });
        
        // Continue processing other bills - don't let one failure stop the process
        continue;
      }
    }
    
    // Return appropriate response based on success/failure
    if (processedBills.length > 0) {
      return res.status(200).json({ 
        success: true, 
        message: `${processedBills.length} bill(s) processed successfully${failedBills.length > 0 ? `, ${failedBills.length} failed` : ''}`,
        bills: processedBills,
        ...(failedBills.length > 0 && { failedBills })
      });
    } else if (failedBills.length > 0) {
      // Check if any failed due to already existing bills
      const existingBillErrors = failedBills.filter(bill => 
        bill.error === "Bill already exists" || 
        (typeof bill.error === "string" && bill.error.includes("already exists"))
      );
      
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
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "No bills to process"
      });
    }
  } catch (error) {
    console.error("Error in postDailyBills:", error);
    return res.status(500).json({ 
      error: "Failed to process bills", 
      details: error instanceof Error ? error.message : "Unknown error"
    });
  } finally {
    await prisma.$disconnect();
  }
}