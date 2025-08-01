import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { logger } from "./lib/PrintLog";

export async function postDailyBills(req: Request, res: Response): Promise<Response> {
  const prisma = new PrismaClient();
  const { bill } = req.body;

  try {

    // validate body
    if (!bill) {
      logger.error("Invalid request body", bill);
      return res.status(400).json({ error: "Invalid request body" });
    }

    console.log("Processing bill input");
    console.log(bill); // Log the start of the bill for debugging
    if (bill.includes("Weekly Sale Report") ||
      (bill.includes("TOTAL NET SALE") && bill.includes("TOTAL COLLECTION")) ||
      (bill.includes("SALE") && bill.includes("RETURN") && bill.includes("NET SALE") && bill.includes("COLLECTION"))) {
      console.log("Detected a summary report instead of a bill - skipping processing");
      return res.status(200).json({
        success: false,
        message: "Input appears to be a summary report rather than individual bills"
      });
    }

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

    // List of known store names for validation
    const knownStores = [
      "RUCHIKA",
      "WEKEYAR PLUS",
      "MAUSIMAA SQUARE",
      "MOUSIMAA",
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
      if (!billText.trim()) continue;

      try {
        // Parse the log data
        const lines = billText.split('\n');
        const billData: any = {
          items: []
        };

        // Clean up log timestamps from each line
        const cleanedLines = lines.map((line: string) => {
          return line.replace(/^Apr \d+ \d+:\d+:\d+ [AP]M|^May \d+ \d+:\d+:\d+ [AP]M/, '').trim();
        }).filter((line: string) => line !== '');

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
          (line.includes("BILL") && (line.includes("CASH") || line.includes("CREDIT"))) ||
          (line.trim() === "CASH" || line.trim() === "CREDIT")
        );

        // Extract customer information - improved extraction to avoid misinterpretation
        billData.customerName = null;
        billData.customerPhone = null;

        if (paymentIndex > 0) {
          // First look for phone number (10 digits) before the payment line
          for (let i = 0; i < paymentIndex; i++) {
            if (cleanedLines[i].match(/^\d{10}$/)) {
              billData.customerPhone = cleanedLines[i];

              // Find the customer name - check lines before the phone number
              // Start from one line before the phone and go backwards
              for (let j = i - 1; j >= 0; j--) {
                const line = cleanedLines[j];
                // Skip lines with specific formats (date, time, etc.)
                if (!line.match(/^\d{2}-\d{2}-\d{4}$/) &&
                  !line.includes("TIME:") &&
                  !line.match(/^\d+$/) &&
                  !line.match(/^\d{1,2}:\d{2}$/) &&
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
                !line.match(/^\d{1,2}:\d{2}$/) &&
                !line.includes("BILL") &&
                !line.includes("/") &&
                !line.match(/^(CASH|CREDIT)$/) &&
                line.length > 2) {
                billData.customerName = line;
                break;
              }
            }
          }
        }

        // Double check that we didn't accidentally pick up store information as customer
        // Store info usually comes after payment type line
        if (billData.customerName && paymentIndex !== -1 &&
          cleanedLines[paymentIndex + 1] === billData.customerName) {
          // This is likely store name, not customer name
          billData.customerName = null;
        }

        if (billData.customerName &&
          (billData.customerName.match(/^[A-Z]+\/\d+$/) || // Format like RUCH/0393
            billData.customerName.match(/^[A-Z]{2}\d+$/))) { // Format like CN00007
          billData.customerName = null;
        }

        // Extract payment type
        if (paymentIndex !== -1) {
          billData.paymentType = cleanedLines[paymentIndex].toLowerCase().includes("cash") ? "cash" : "credit";
        }

        // Extract store information - appears after payment type
        // MODIFIED: Improved store name extraction to recognize known stores
        if (paymentIndex !== -1) {
          let foundKnownStore = false;

          // Check for known store names after the payment line
          for (let i = paymentIndex + 1; i < Math.min(paymentIndex + 5, cleanedLines.length); i++) {
            const line = cleanedLines[i];

            // Check if this line matches any known store name
            const matchedStore = knownStores.find(store =>
              line.toUpperCase() === store.toUpperCase()
            );

            if (matchedStore) {
              billData.storeName = matchedStore;
              foundKnownStore = true;

              // Store location is usually after store name
              if (i + 1 < cleanedLines.length) {
                billData.storeLocation = cleanedLines[i + 1];
              }

              // Store phone is usually after location
              if (i + 2 < cleanedLines.length &&
                cleanedLines[i + 2].match(/^\d{10}$/)) {
                billData.storePhone = cleanedLines[i + 2];
              }

              break;
            }
          }

          // If no known store was found, fall back to the original logic
          if (!foundKnownStore) {
            // Store name is usually right after the payment line
            if (paymentIndex + 1 < cleanedLines.length) {
              billData.storeName = cleanedLines[paymentIndex + 1];
            }

            // Store location is usually after store name
            if (paymentIndex + 2 < cleanedLines.length) {
              billData.storeLocation = cleanedLines[paymentIndex + 2];
            }

            // Store phone is usually after location
            if (paymentIndex + 3 < cleanedLines.length &&
              cleanedLines[paymentIndex + 3].match(/^\d{10}$/)) {
              billData.storePhone = cleanedLines[paymentIndex + 3];
            }
          }
        }

        const amountTextIndex = cleanedLines.findIndex((line: string) =>
          line.startsWith("Rs.") && (line.includes("Only") || line.includes("only"))
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
            // Look for the LAST decimal amount before the software line
            // (typically there are multiple values, with the final one being the amount paid)
            const searchWindow = cleanedLines.slice(amountTextIndex + 1, softwareLineIndex);

            // Find the LAST amount in these lines - override previous values
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

        // IMPROVED ITEM EXTRACTION LOGIC with support for all three formats
        const medicineItems: any[] = [];

        // Find where the actual medicine items start - typically after GST information
        const gstLineIndex = cleanedLines.findIndex((line: string) =>
          /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]/.test(line)
        );

        // Start looking for items after the GST line
        const startIndex = gstLineIndex !== -1 ? gstLineIndex + 1 : 0;

        // Handle all formats for items
        for (let i = startIndex; i < cleanedLines.length; i++) {
          const line = cleanedLines[i];
          let matched = false;
          let quantity = 0;
          let itemName = '';

          // Don't process lines after "Rs." line (which indicates the bill summary)
          if (line.startsWith("Rs.") && line.includes("Only")) {
            break;
          }

          // FORMAT 2: "0:4 DROTIN DS TAB" - Quantity with colon and item name on same line
          if (/^\d+:\d+\s+\S/.test(line)) {
            const quantityParts = line.split(' ');
            if (quantityParts.length >= 2) {
              // For "1:0" format, use the first digit as quantity
              const quantityMatch = quantityParts[0].match(/^(\d+):(\d+)$/);
              if (quantityMatch) {
                // Try the first number first, if it's 0 then use the second number
                const firstNumber = parseInt(quantityMatch[1]);
                const secondNumber = parseInt(quantityMatch[2]);
                quantity = firstNumber > 0 ? firstNumber : secondNumber;
              } else {
                quantity = 1; // Default if pattern doesn't match
              }

              itemName = line.substring(line.indexOf(' ')).trim();
              matched = true;
            }
          }
          // FORMAT 3: Quantity with colon "1:0" on one line and item name on next line
          else if (/^\d+:\d+$/.test(line)) {
            const quantityMatch = line.match(/^(\d+):(\d+)$/);
            if (quantityMatch && i + 1 < cleanedLines.length) {
              // Check if next line could be item name
              if (!(/^\d+$/.test(cleanedLines[i + 1])) &&
                !(/^\d{1,2}\/\d{2,4}$/.test(cleanedLines[i + 1])) &&
                !(/^[A-Z0-9]+$/.test(cleanedLines[i + 1]) && cleanedLines[i + 1].length <= 6) &&
                !cleanedLines[i + 1].startsWith("Rs.")) {

                // For "1:0" format, use the first digit as quantity
                const firstNumber = parseInt(quantityMatch[1]);
                const secondNumber = parseInt(quantityMatch[2]);
                quantity = firstNumber > 0 ? firstNumber : secondNumber;

                itemName = cleanedLines[i + 1];
                matched = true;
                i++; // Skip the item name line since we've processed it
              }
            }
          }
          // FORMAT 1: Just a single digit number alone (not phone numbers)
          else if (/^[1-9]\d{0,2}$/.test(line)) { // Restrict to max 3 digits (999)
            quantity = parseInt(line);
            // Check if next line could be item name
            if (i + 1 < cleanedLines.length &&
              !(/^\d+$/.test(cleanedLines[i + 1])) &&
              !(/^\d{1,2}\/\d{2,4}$/.test(cleanedLines[i + 1])) &&
              !(/^[A-Z0-9]+$/.test(cleanedLines[i + 1]) && cleanedLines[i + 1].length <= 6) &&
              !cleanedLines[i + 1].startsWith("Rs.")) {
              itemName = cleanedLines[i + 1];
              matched = true;
              i++; // Skip the item name line since we've processed it
            }
          }

          if (matched) {
            // Initialize the item object
            const item: any = {
              quantity: quantity,
              item: itemName,
              batch: '',
              expBatch: '',
              mrp: 0,
              discount: 0
            };

            // Look ahead for additional item information (batch, expiry, price)
            let lineIndex = i + 1;
            let decimalValuesFound = 0;

            while (lineIndex < cleanedLines.length && lineIndex < i + 10) {
              const nextLine = cleanedLines[lineIndex];

              // Stop if we find the next item pattern or bill summary
              if (/^\d+:\d+/.test(nextLine) || // New format patterns (any X:Y format)
                /^[1-9]\d{0,2}$/.test(nextLine) || // Old format pattern (just a number)
                nextLine.startsWith("Rs.")) { // End of items section
                break;
              }

              // Check for batch (usually an alphanumeric code on the line after item name)
              if (lineIndex === i + 1 && /^[A-Z0-9]+$/.test(nextLine) && nextLine.length <= 6) {
                item.batch = nextLine;
              }
              // Check for expiry date (usually in MM/YY format)
              else if (/^\d{1,2}\/\d{2,4}$/.test(nextLine)) {
                item.expBatch = nextLine;
              }
              // Process decimal values (prices)
              else if (/^\d+\.\d{2}$/.test(nextLine)) {
                decimalValuesFound++;
                if (decimalValuesFound === 1) {
                  item.mrp = parseFloat(nextLine);
                } else if (decimalValuesFound === 6) { // The 6th decimal value is typically the discount
                  item.discount = parseFloat(nextLine);
                }
              }

              lineIndex++;
            }

            // Add the item to our list
            medicineItems.push(item);
          }
        }

        // Use the medicine items we extracted
        if (medicineItems.length > 0) {
          billData.items = medicineItems;
        }

        // Remove duplicate code - this was repeated twice in the original


        // Debug log the extracted bill data
        console.log("Extracted bill data:", JSON.stringify(billData, null, 2));

        // Validation - Skip bills with invalid data
        if (!billData.billNo || !billData.date || isNaN(billData.date.getTime())) {
          logger.error(`Invalid bill data: ${billData}`);
          failedBills.push({
            error: "Missing essential bill information (bill number or date)",
            billText: billText.substring(0, 100) + "..."
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

        if (billData.storeName) {
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
            // If there's still an error with store creation, throw it
            throw new Error(`Store creation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
        } else {
          // Skip bills without store information
          throw new Error("Missing store information");
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
          where: {
            billNo_storeId: {
              billNo: billData.billNo,
              storeId: store.id
            }
          }
        });

        if (existingBill) {
          // Skip bills that already exist
          console.error(`Bill with number ${billData.billNo} already exists`);
          return res.status(200).json({ success: true });
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
        logger.error(`Error processing bill:${error}`);
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
      failedBills.map((bill) => {
        console.log("Failed bill:", bill.error);
        console.log("Failed bill:", bill.error.includes("already exists"));
      })
      const allMissingEssentialInfo = failedBills.every(bill =>
        bill.error === "Missing essential bill information (bill number or date)" ||
        bill.error.includes("already exists")
      );

      // If all failures are due to missing essential info, return success to prevent retries
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