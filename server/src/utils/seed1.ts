import { PrismaClient } from '@prisma/client';

async function moveAllBills() {
  const prisma = new PrismaClient();
  let migratedBillIds: number[] = [];
  const BATCH_SIZE = 50; // Smaller batch size - less chance of timeouts
  
  try {
    console.log('Starting migration of all bills from WEKEYAR PLUS to CHANDRASEKHARPUR...');
    
    // Step 1: Find both stores
    const wekeyarPlus = await prisma.store.findFirst({
      where: { 
        storeName: 'WEKEYAR PLUS' 
      }
    });
    
    const chandrasekharpur = await prisma.store.findFirst({
      where: { 
        storeName: 'CHANDRASEKHARPUR' 
      }
    });
    
    // Verify both stores exist
    if (!wekeyarPlus) {
      throw new Error('WEKEYAR PLUS store not found in database');
    }
    
    if (!chandrasekharpur) {
      throw new Error('CHANDRASEKHARPUR store not found in database');
    }
    
    console.log(`Found WEKEYAR PLUS store with ID: ${wekeyarPlus.id}`);
    console.log(`Found CHANDRASEKHARPUR store with ID: ${chandrasekharpur.id}`);
    
    // Step 2: Count total bills to migrate
    const totalBillCount = await prisma.bill.count({
      where: {
        storeId: wekeyarPlus.id
      }
    });
    
    console.log(`Found ${totalBillCount} total bills to migrate`);
    
    if (totalBillCount === 0) {
      console.log('No bills found for WEKEYAR PLUS store. Nothing to migrate.');
      return;
    }
    
    // Step 3: Process bills in batches
    let skip = 0;
    let processedCount = 0;
    
    while (processedCount < totalBillCount) {
      // Get the current batch of bills
      const billBatch = await prisma.bill.findMany({
        where: {
          storeId: wekeyarPlus.id
        },
        include: {
          customer: true
        },
        skip: skip,
        take: BATCH_SIZE
      });
      
      if (billBatch.length === 0) break;
      
      console.log(`Processing batch of ${billBatch.length} bills (${processedCount + 1} to ${processedCount + billBatch.length} of ${totalBillCount})`);
      
      // Process each bill individually instead of using a transaction
      const batchBillIds = billBatch.map(bill => bill.id);
      const thisBatchMigrated: number[] = [];
      
      try {
        for (const bill of billBatch) {
          console.log(`Migrating bill #${bill.billNo} (ID: ${bill.id}), Customer: ${bill.customer.name}`);
          
          await prisma.bill.update({
            where: { id: bill.id },
            data: { storeId: chandrasekharpur.id }
          });
          
          thisBatchMigrated.push(bill.id);
        }
        
        // If we made it here, all bills in this batch were successfully migrated
        migratedBillIds.push(...thisBatchMigrated);
        console.log(`Batch completed: ${thisBatchMigrated.length} bills migrated`);
        
      } catch (batchError) {
        console.error(`Error processing batch: ${batchError}`);
        
        // Attempt to roll back this batch immediately
        console.log(`Attempting to roll back ${thisBatchMigrated.length} bills from the current batch...`);
        
        for (const billId of thisBatchMigrated) {
          try {
            await prisma.bill.update({
              where: { id: billId },
              data: { storeId: wekeyarPlus.id }
            });
            console.log(`Rolled back bill ID: ${billId}`);
          } catch (rollbackError) {
            console.error(`Failed to roll back bill ID: ${billId}`, rollbackError);
          }
        }
        
        // Re-throw to trigger the main error handling
        throw batchError;
      }
      
      // Update counters for next batch
      processedCount += billBatch.length;
      skip += BATCH_SIZE;
      
      // Quick verification after each batch
      const batchVerificationCount = await prisma.bill.count({
        where: {
          id: { in: batchBillIds },
          storeId: chandrasekharpur.id
        }
      });
      
      if (batchVerificationCount !== batchBillIds.length) {
        throw new Error(`Batch verification failed: Only ${batchVerificationCount} of ${batchBillIds.length} bills were migrated correctly`);
      }
      
      console.log(`Batch verification passed: All ${batchVerificationCount} bills correctly migrated\n`);
    }
    
    // Step 4: Verify the entire migration was successful
    const totalVerificationCount = await prisma.bill.count({
      where: {
        id: { in: migratedBillIds },
        storeId: chandrasekharpur.id
      }
    });
    
    if (totalVerificationCount !== migratedBillIds.length) {
      throw new Error(`Migration verification failed: Only ${totalVerificationCount} of ${migratedBillIds.length} bills were migrated correctly`);
    }
    
    console.log(`Migration verified: All ${totalVerificationCount} bills now belong to CHANDRASEKHARPUR store`);
    
    // Add 20-second pause for manual verification
    console.log('\nWaiting 20 seconds for manual verification...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    console.log('Wait complete. Continuing with script...');
    
    // Too many IDs to include in a SQL statement, just provide instructions
    console.log('\nTo revert this change if needed:');
    console.log(`
    1. Use Prisma Studio: npx prisma studio
    2. Filter bills by store ID ${chandrasekharpur.id}
    3. Batch update the storeId back to ${wekeyarPlus.id}
    `);
    
    console.log('\nMigration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
    
    // Perform rollback for all migrated bills
    if (migratedBillIds.length > 0) {
      console.log(`Error occurred during migration. Attempting to roll back ${migratedBillIds.length} migrated bills...`);
      
      try {
        const wekeyarPlus = await prisma.store.findFirst({
          where: { 
            storeName: 'WEKEYAR PLUS' 
          }
        });
        
        if (!wekeyarPlus) {
          throw new Error('Could not find WEKEYAR PLUS store for rollback');
        }
        
        // Rollback in smaller batches to avoid timeouts
        const ROLLBACK_BATCH_SIZE = 25;
        let rollbackSuccessCount = 0;
        
        for (let i = 0; i < migratedBillIds.length; i += ROLLBACK_BATCH_SIZE) {
          const batchIds = migratedBillIds.slice(i, i + ROLLBACK_BATCH_SIZE);
          
          // Update each bill individually
          for (const id of batchIds) {
            try {
              await prisma.bill.update({
                where: { id },
                data: { storeId: wekeyarPlus.id }
              });
              rollbackSuccessCount++;
            } catch (err) {
              console.error(`Failed to roll back bill ID ${id}:`, err);
            }
          }
          
          console.log(`Rolled back batch ${Math.floor(i / ROLLBACK_BATCH_SIZE) + 1}: processed ${batchIds.length} bills`);
        }
        
        console.log(`Rollback completed: ${rollbackSuccessCount} of ${migratedBillIds.length} bills rolled back successfully`);
        
        // Check if rollback was fully successful
        if (rollbackSuccessCount < migratedBillIds.length) {
          console.error(`WARNING: ${migratedBillIds.length - rollbackSuccessCount} bills could not be rolled back automatically.`);
          console.error('You may need to manually check and fix these remaining bills.');
        }
        
      } catch (rollbackError) {
        console.error('Critical error during rollback:', rollbackError);
        console.error('Manual intervention required for data consistency.');
        console.error(`The following bills need to be checked: IDs ${migratedBillIds.join(', ')}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the migration
moveAllBills()
  .then(() => console.log('Migration script execution completed'))
  .catch(error => console.error('Migration script failed:', error));