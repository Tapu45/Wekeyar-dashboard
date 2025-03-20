"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMiddleware = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadPath = path_1.default.resolve(__dirname, '../uploads/');
        console.log(`Saving file to: ${uploadPath}`);
        cb(null, uploadPath);
    },
    filename: (_req, file, cb) => {
        const filename = `${Date.now()}-${file.originalname}`;
        console.log(`Generated filename: ${filename}`);
        cb(null, filename);
    }
});
const fileFilter = (_req, file, cb) => {
    console.log(`File received: ${file.originalname}`);
    console.log(`MIME type: ${file.mimetype}`);
    console.log(`File extension: ${path_1.default.extname(file.originalname).toLowerCase()}`);
    const allowedMimeTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
    ];
    const filetypes = /xlsx|xls/;
    const extname = filetypes.test(path_1.default.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.includes(file.mimetype);
    if (mimetype && extname) {
        console.log('File type is valid.');
        return cb(null, true);
    }
    else {
        console.error('Invalid file type.');
        return cb(new Error('File upload only supports Excel files (.xlsx, .xls)'));
    }
};
exports.uploadMiddleware = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }
}).single('excelFile');
//# sourceMappingURL=middleware.js.map