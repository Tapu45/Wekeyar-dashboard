import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { Worker } from 'worker_threads';
import path from 'path';

import cloudinary from '../utils/cloudinary';

const prisma = new PrismaClient();

// Map to track active worker threads
const activeWorkers = new Map<number, Worker>();

export const uploadExcelFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      console.error("No file uploaded.");
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const file = req.file as Express.Multer.File;
    const fileName = req.file.originalname;

    // Validate file extension
    const fileExtension = path.extname(fileName).toLowerCase();
    if (fileExtension !== ".xlsx") {
      console.error("Invalid file format. Only .xlsx files are supported.");
      res.status(400).json({ error: "Invalid file format. Only .xlsx files are supported." });
      return;
    }

    // Upload the file to Cloudinary directly from memory
    console.log("Uploading file to Cloudinary...");
    const cloudinaryResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "uploads", resource_type: "raw" },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      stream.end(file.buffer);
    });

    console.log("File uploaded to Cloudinary:", (cloudinaryResult as any).secure_url);

    // Create an entry in the UploadHistory table with "in-progress" status
    const uploadHistory = await prisma.uploadHistory.create({
      data: {
        fileName,
        fileUrl: (cloudinaryResult as any).secure_url,
        status: "in-progress",
      },
    });

    // Send immediate response to client
    res.status(202).json({
      success: true,
      message: "File upload started",
      uploadId: uploadHistory.id,
      status: "processing",
    });

    // Process in background without blocking the response
    processFileInBackground(uploadHistory.id, (cloudinaryResult as any).secure_url);

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Error uploading file" });
  }
};

// Background processing function
async function processFileInBackground(uploadId: number, fileUrl: string) {
  const workerPath = path.resolve(__dirname, "./excelProccessor.js");

  if (!fs.existsSync(workerPath)) {
    console.error(`Worker file does not exist at: ${workerPath}`);
    await prisma.uploadHistory.update({
      where: { id: uploadId },
      data: { status: "failed" },
    });
    return;
  }

  const worker = new Worker(workerPath, {
    workerData: { fileUrl },
  });

  // Store worker reference
  activeWorkers.set(uploadId, worker);

  worker.on("message", async (message) => {
    try {
      if (message.status === "log") {
        sendLogUpdate(uploadId, message.log);
      } else if (message.status === "progress") {
        sendLogUpdate(uploadId, `Progress: ${message.progress}%`);
      } else if (message.status === "completed") {
        await prisma.uploadHistory.update({
          where: { id: uploadId },
          data: {
            status: "completed",
          },
        });
        sendLogUpdate(uploadId, `✅ Upload completed successfully`);
        activeWorkers.delete(uploadId);
      } else if (message.status === "error") {
        await prisma.uploadHistory.update({
          where: { id: uploadId },
          data: { status: "failed" },
        });
        sendLogUpdate(uploadId, `❌ Error: ${message.error}`);
        activeWorkers.delete(uploadId);
      }
    } catch (error) {
      console.error("Error handling worker message:", error);
      activeWorkers.delete(uploadId);
    }
  });

  worker.on("error", async (error) => {
    console.error("Worker error:", error);
    try {
      await prisma.uploadHistory.update({
        where: { id: uploadId },
        data: { status: "failed" },
      });
      sendLogUpdate(uploadId, `❌ Worker error: ${error.message}`);
    } catch (dbError) {
      console.error("Error updating upload status:", dbError);
    }
    activeWorkers.delete(uploadId);
  });

  worker.on("exit", async (code) => {
    if (code !== 0) {
      console.error(`Worker exited with code ${code}`);
      try {
        const uploadStatus = await prisma.uploadHistory.findUnique({
          where: { id: uploadId },
        });
        if (uploadStatus?.status === "in-progress") {
          await prisma.uploadHistory.update({
            where: { id: uploadId },
            data: { status: "failed" },
          });
        }
      } catch (error) {
        console.error("Error updating status on worker exit:", error);
      }
    }
    activeWorkers.delete(uploadId);
  });
}

export const getUploadHistory = async (_req: Request, res: Response): Promise<void> => {
  try {
    const history = await prisma.uploadHistory.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(history);
  } catch (error) {
    console.error("Error fetching upload history:", error);
    res.status(500).json({ error: "Failed to fetch upload history" });
  }
};

export const deleteUploadHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (id) {
      const parsedId = parseInt(id, 10);

      if (isNaN(parsedId)) {
        res.status(400).json({ error: "Invalid ID format" });
        return;
      }

      // Kill worker if still running
      const worker = activeWorkers.get(parsedId);
      if (worker) {
        worker.terminate();
        activeWorkers.delete(parsedId);
      }

      const deletedRecord = await prisma.uploadHistory.delete({
        where: { id: parsedId },
      });

      res.status(200).json({ message: "Upload history record deleted successfully", deletedRecord });
    } else {
      // Delete all records and terminate all workers
      activeWorkers.forEach((worker) => {
        worker.terminate();
      });
      activeWorkers.clear();

      await prisma.uploadHistory.deleteMany();
      res.status(200).json({ message: "All upload history records deleted successfully" });
    }
  } catch (error) {
    console.error("Error deleting upload history:", error);
    res.status(500).json({ error: "Failed to delete upload history" });
  }
};

export const getUploadStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const uploadHistory = await prisma.uploadHistory.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!uploadHistory) {
      res.status(404).json({ error: "Upload not found" });
      return;
    }

    res.status(200).json(uploadHistory);
  } catch (error) {
    console.error("Error fetching upload status:", error);
    res.status(500).json({ error: "Error fetching upload status" });
  }
};

const activeLogConnections: Map<number, Response> = new Map();

export const uploadLogsSSE = (req: Request, res: Response): void => {
  const { id } = req.params;
  const uploadId = parseInt(id, 10);

  if (isNaN(uploadId)) {
    res.status(400).json({ error: "Invalid upload ID" });
    return;
  }

  // Set headers for SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  activeLogConnections.set(uploadId, res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ log: "Connected to log stream..." })}\n\n`);

  // Heartbeat to keep connection alive
  const heartbeatInterval = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(heartbeatInterval);
      activeLogConnections.delete(uploadId);
      return;
    }
    res.write(`: heartbeat\n\n`);
  }, 30000); // Every 30 seconds

  req.on("close", () => {
    clearInterval(heartbeatInterval);
    activeLogConnections.delete(uploadId);
    res.end();
  });
};

export const sendLogUpdate = (uploadId: number, log: string): void => {
  const connection = activeLogConnections.get(uploadId);
  if (connection && !connection.writableEnded) {
    connection.write(`data: ${JSON.stringify({ log, timestamp: new Date().toISOString() })}\n\n`);
  }
};