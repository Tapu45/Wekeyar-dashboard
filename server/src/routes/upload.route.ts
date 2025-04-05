import express from 'express';
import { uploadMiddleware } from '../middleware';
import { uploadExcelFile, getUploadHistory, getUploadStatus, deleteUploadHistory, uploadLogsSSE } from '../controllers/uploadController';
import { postDailyBills } from '../controllers/billController';

const router = express.Router();

// Route for uploading large Excel files (processed in worker thread)
router.post('/upload', (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error("Error during file upload:", err);
      return res.status(400).json({ error: err.message });
    }

    // Explicitly call next() to ensure all code paths are handled
    return next();
  });
}, uploadExcelFile);



router.get('/upload/history', getUploadHistory);
router.delete("/upload/history/:id?", deleteUploadHistory);

router.get("/upload/status/:id", getUploadStatus);
router.get("/upload/logs/:id", uploadLogsSSE);

router.post("/upload/daily/bill", postDailyBills);

export default router;