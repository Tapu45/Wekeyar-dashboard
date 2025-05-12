import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import xlsx from 'xlsx';
import csv from 'csv-parser';
import { Readable } from 'stream';

// Initialize Prisma client
const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'product-imports', // Cast to `any` to avoid type errors
      resource_type: 'auto',
    } as any, // Explicitly cast to `any`
  });

// Setup multer upload
const upload = multer({ storage }).single('file');

// Debug function to log column names
function logColumnNames(data: any[]) {
  if (data.length === 0) return console.log("No data rows found");
  const firstRow = data[0];
  console.log("Column names found:", Object.keys(firstRow));
}

export const importProduct = async (req: Request, res: Response) => {
  // Handle file upload with multer
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: 'File upload failed', details: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const fileUrl = req.file.path || (req.file as any).secure_url;
      const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
      
      console.log(`Processing file: ${req.file.originalname}, stored at: ${fileUrl}`);
      
      let products = [];
      
      // Extract data based on file type
      if (fileExtension === 'csv') {
        products = await extractFromCSV(fileUrl);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        products = await extractFromExcel(fileUrl);
      } else {
        return res.status(400).json({ error: 'Unsupported file type. Please upload CSV or Excel file.' });
      }
      
      console.log(`Extracted ${products.length} products from file`);
      
      if (products.length === 0) {
        return res.status(400).json({ error: 'No valid products found in the file' });
      }
      
      // Insert products into database
      const result = await insertProducts(products);
      
      return res.status(200).json({
        success: true,
        message: 'Products imported successfully',
        totalProcessed: products.length,
        successCount: result.successCount,
        errorCount: result.errorCount,
        cloudinaryFileUrl: fileUrl,
        errors: result.errors.length > 0 ? result.errors : undefined
      });
      
    } catch (error) {
      console.error('Import process failed:', error);
      return res.status(500).json({ 
        error: 'Import process failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
};

// Extract data from CSV file
async function extractFromCSV(fileUrl: string): Promise<any[]> {
  const products: any[] = [];
  
  // Download file from Cloudinary
  const response = await fetch(fileUrl);
  const buffer = await response.arrayBuffer();
  
  // Create a readable stream from buffer
  const stream = Readable.from(Buffer.from(buffer));
  
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    
    stream
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', () => {
        // Log column names for debugging
        if (results.length > 0) {
          logColumnNames(results);
        }
        
        // Process each row
        for (const row of results) {
          // Check for all possible column name variations
          const name = row.ITEM || row.Item || row['I T E M'] || '';
          
          if (!name) continue; // Skip rows without a name
          
          // Check for all possible company column variations
          const company = row.Compnay || row.Company || row.COMPANY || row.Compnay || '';
          const description = company ? `Provided by ${company}` : '';
          
          products.push({
            name,
            description,
            price: 0.0 // Default price as requested
          });
        }
        
        resolve(products);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Extract data from Excel file
async function extractFromExcel(fileUrl: string) {
  const products = [];
  
  // Download file from Cloudinary
  const response = await fetch(fileUrl);
  const buffer = await response.arrayBuffer();
  
  // Read Excel file
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON with header row
  const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Identify header row and column indices
  if (rows.length < 2) {
    console.log("Excel file has insufficient data");
    return [];
  }
  
  // Find the header row
  let headerRow = rows[0] as string[];
  if (!Array.isArray(headerRow)) {
    console.log("Header row not found in expected format");
    return [];
  }
  
  // If the first row doesn't look like a header, try the second row
  if (!headerRow.some(col => typeof col === 'string' && 
      (col.includes('ITEM') || col.includes('Item') || col.includes('SL')))) {
    headerRow = rows[1] as string[];
  }
  
  console.log("Header row:", headerRow);
  
  // Find column indices
  const itemColIndex = headerRow.findIndex(col => 
    typeof col === 'string' && 
    (col.includes('ITEM') || col === 'Item' || col === 'I T E M')
  );
  
  const companyColIndex = headerRow.findIndex(col => 
    typeof col === 'string' && 
    (col.includes('Compnay') || col.includes('Company') || col.includes('COMPANY'))
  );
  
  console.log(`Column indices - Item: ${itemColIndex}, Company: ${companyColIndex}`);
  
  if (itemColIndex === -1) {
    console.log("Item column not found in Excel file");
    
    // Last attempt - convert using default approach and check results
    const jsonRows = xlsx.utils.sheet_to_json(worksheet);
    logColumnNames(jsonRows);
    
    // Process using dynamic column detection
    for (const row of jsonRows) {
      // Try to find any column that might contain item name
      let name = '';
      let company = '';
      
      Object.entries(row as Record<string, unknown>).forEach(([key, value]) => {
        if (!name && typeof value === 'string' && key.toUpperCase().includes('ITEM')) {
          name = value;
        }
        if (!company && typeof value === 'string' && 
            (key.toUpperCase().includes('COMP') || key.toUpperCase().includes('COMPANY'))) {
          company = value;
        }
      });
      
      // If no column headers match, take SL_NO and the value right after it as the name
      if (!name && typeof row === 'object' && row !== null && 'SL NO' in row && '__EMPTY_1' in row && row['SL NO'] !== undefined && row['__EMPTY_1'] !== undefined) {
        name = typeof row['__EMPTY_1'] === 'string' ? row['__EMPTY_1'] : '';
      }
      
      if (!name) continue;
      
      const description = company ? `Provided by ${company}` : '';
      
      products.push({
        name,
        description,
        price: 0.0
      });
    }
    
    return products;
  }
  
  // Process data rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as any[];
    if (!Array.isArray(row)) continue;
    
    const name = row[itemColIndex];
    if (!name) continue;
    
    const company = companyColIndex !== -1 ? row[companyColIndex] || '' : '';
    const description = company ? `Provided by ${company}` : '';
    
    products.push({
      name: String(name),
      description,
      price: 0.0
    });
  }
  
  return products;
}

// Insert products into database with batching for performance
async function insertProducts(products: any[]) {
  const BATCH_SIZE = 1000;
  const totalProducts = products.length;
  const batches = Math.ceil(totalProducts / BATCH_SIZE);
  
  let successCount = 0;
  let errorCount = 0;
  const errors: any[] = [];
  
  console.log(`Starting database insertion in ${batches} batches`);
  
  for (let i = 0; i < batches; i++) {
    const batchStart = i * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, totalProducts);
    const batch = products.slice(batchStart, batchEnd);
    
    try {
      // Use createMany for faster inserts
      const result = await prisma.product.createMany({
        data: batch,
        skipDuplicates: true,
      });
      
      successCount += result.count;
      console.log(`Batch ${i+1}/${batches}: Inserted ${result.count} products`);
    } catch (error) {
      console.error(`Error in batch ${i+1}:`, error);
      errorCount += batch.length;
      errors.push({
        batch: i+1,
        error: error instanceof Error ? error.message : 'Unknown error',
        sampleData: batch.slice(0, 2) // Include sample data for debugging
      });
    }
  }
  
  return { successCount, errorCount, errors };
}