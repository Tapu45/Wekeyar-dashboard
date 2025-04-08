"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importProduct = void 0;
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const xlsx_1 = __importDefault(require("xlsx"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const stream_1 = require("stream");
const prisma = new client_1.PrismaClient();
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const storage = new multer_storage_cloudinary_1.CloudinaryStorage({
    cloudinary: cloudinary_1.v2,
    params: {
        folder: 'product-imports',
        resource_type: 'auto',
    },
});
const upload = (0, multer_1.default)({ storage }).single('file');
function logColumnNames(data) {
    if (data.length === 0)
        return console.log("No data rows found");
    const firstRow = data[0];
    console.log("Column names found:", Object.keys(firstRow));
}
const importProduct = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: 'File upload failed', details: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        try {
            const fileUrl = req.file.path || req.file.secure_url;
            const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
            console.log(`Processing file: ${req.file.originalname}, stored at: ${fileUrl}`);
            let products = [];
            if (fileExtension === 'csv') {
                products = await extractFromCSV(fileUrl);
            }
            else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                products = await extractFromExcel(fileUrl);
            }
            else {
                return res.status(400).json({ error: 'Unsupported file type. Please upload CSV or Excel file.' });
            }
            console.log(`Extracted ${products.length} products from file`);
            if (products.length === 0) {
                return res.status(400).json({ error: 'No valid products found in the file' });
            }
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
        }
        catch (error) {
            console.error('Import process failed:', error);
            return res.status(500).json({
                error: 'Import process failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
};
exports.importProduct = importProduct;
async function extractFromCSV(fileUrl) {
    const products = [];
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    const stream = stream_1.Readable.from(Buffer.from(buffer));
    return new Promise((resolve, reject) => {
        const results = [];
        stream
            .pipe((0, csv_parser_1.default)())
            .on('data', (row) => {
            results.push(row);
        })
            .on('end', () => {
            if (results.length > 0) {
                logColumnNames(results);
            }
            for (const row of results) {
                const name = row.ITEM || row.Item || row['I T E M'] || '';
                if (!name)
                    continue;
                const company = row.Compnay || row.Company || row.COMPANY || row.Compnay || '';
                const description = company ? `Provided by ${company}` : '';
                products.push({
                    name,
                    description,
                    price: 0.0
                });
            }
            resolve(products);
        })
            .on('error', (error) => {
            reject(error);
        });
    });
}
async function extractFromExcel(fileUrl) {
    const products = [];
    const response = await fetch(fileUrl);
    const buffer = await response.arrayBuffer();
    const workbook = xlsx_1.default.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx_1.default.utils.sheet_to_json(worksheet, { header: 1 });
    if (rows.length < 2) {
        console.log("Excel file has insufficient data");
        return [];
    }
    let headerRow = rows[0];
    if (!Array.isArray(headerRow)) {
        console.log("Header row not found in expected format");
        return [];
    }
    if (!headerRow.some(col => typeof col === 'string' &&
        (col.includes('ITEM') || col.includes('Item') || col.includes('SL')))) {
        headerRow = rows[1];
    }
    console.log("Header row:", headerRow);
    const itemColIndex = headerRow.findIndex(col => typeof col === 'string' &&
        (col.includes('ITEM') || col === 'Item' || col === 'I T E M'));
    const companyColIndex = headerRow.findIndex(col => typeof col === 'string' &&
        (col.includes('Compnay') || col.includes('Company') || col.includes('COMPANY')));
    console.log(`Column indices - Item: ${itemColIndex}, Company: ${companyColIndex}`);
    if (itemColIndex === -1) {
        console.log("Item column not found in Excel file");
        const jsonRows = xlsx_1.default.utils.sheet_to_json(worksheet);
        logColumnNames(jsonRows);
        for (const row of jsonRows) {
            let name = '';
            let company = '';
            Object.entries(row).forEach(([key, value]) => {
                if (!name && typeof value === 'string' && key.toUpperCase().includes('ITEM')) {
                    name = value;
                }
                if (!company && typeof value === 'string' &&
                    (key.toUpperCase().includes('COMP') || key.toUpperCase().includes('COMPANY'))) {
                    company = value;
                }
            });
            if (!name && typeof row === 'object' && row !== null && 'SL NO' in row && '__EMPTY_1' in row && row['SL NO'] !== undefined && row['__EMPTY_1'] !== undefined) {
                name = typeof row['__EMPTY_1'] === 'string' ? row['__EMPTY_1'] : '';
            }
            if (!name)
                continue;
            const description = company ? `Provided by ${company}` : '';
            products.push({
                name,
                description,
                price: 0.0
            });
        }
        return products;
    }
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!Array.isArray(row))
            continue;
        const name = row[itemColIndex];
        if (!name)
            continue;
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
async function insertProducts(products) {
    const BATCH_SIZE = 1000;
    const totalProducts = products.length;
    const batches = Math.ceil(totalProducts / BATCH_SIZE);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    console.log(`Starting database insertion in ${batches} batches`);
    for (let i = 0; i < batches; i++) {
        const batchStart = i * BATCH_SIZE;
        const batchEnd = Math.min(batchStart + BATCH_SIZE, totalProducts);
        const batch = products.slice(batchStart, batchEnd);
        try {
            const result = await prisma.product.createMany({
                data: batch,
                skipDuplicates: true,
            });
            successCount += result.count;
            console.log(`Batch ${i + 1}/${batches}: Inserted ${result.count} products`);
        }
        catch (error) {
            console.error(`Error in batch ${i + 1}:`, error);
            errorCount += batch.length;
            errors.push({
                batch: i + 1,
                error: error instanceof Error ? error.message : 'Unknown error',
                sampleData: batch.slice(0, 2)
            });
        }
    }
    return { successCount, errorCount, errors };
}
//# sourceMappingURL=productController.js.map