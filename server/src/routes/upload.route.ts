import express from 'express';
import { uploadMiddleware } from '../middleware';
import { uploadExcelFile, processExcelFileSync, getUploadHistory, getUploadStatus, deleteUploadHistory } from '../controllers/uploadController';

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

// Alternative route for smaller files (synchronous processing)
router.post('/upload/sync', (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      console.error("Error during file upload:", err);
      return res.status(400).json({ error: err.message });
    }

    // Explicitly call next() to ensure all code paths are handled
    return next();
  });
}, processExcelFileSync);

router.get('/upload/history', getUploadHistory);
router.delete("/upload/history/:id?", deleteUploadHistory);

router.get("/upload/status/:id", getUploadStatus);

export default router;