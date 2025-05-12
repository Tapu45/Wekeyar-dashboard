// src/middleware/upload.middleware.ts
import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => {
//     const uploadPath = path.resolve(__dirname, '../uploads/');
//     console.log(`Saving file to: ${uploadPath}`);
//     cb(null, uploadPath);
//   },
//   filename: (_req, file, cb) => {
//     const filename = `${Date.now()}-${file.originalname}`;
//     console.log(`Generated filename: ${filename}`);
//     cb(null, filename);
//   }
// });

const storage = multer.memoryStorage(); 

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log(`File received: ${file.originalname}`);
  console.log(`MIME type: ${file.mimetype}`);
  console.log(`File extension: ${path.extname(file.originalname).toLowerCase()}`);

  const allowedMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];
  const filetypes = /xlsx|xls/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (mimetype && extname) {
    console.log('File type is valid.');
    return cb(null, true);
  } else {
    console.error('Invalid file type.');
    return cb(new Error('File upload only supports Excel files (.xlsx, .xls)'));
  }
};

export const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).single('excelFile');

