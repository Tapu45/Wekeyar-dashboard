// src/controllers/upload.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { Worker } from 'worker_threads';
import path from 'path';

import cloudinary from '../utils/cloudinary';

const prisma = new PrismaClient();


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
      stream.end(file.buffer); // Use the file buffer from memory
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

    const workerPath = path.resolve(__dirname, "./excelProccessor.js");
    if (!fs.existsSync(workerPath)) {
      console.error(`Worker file does not exist at: ${workerPath}`);
      res.status(500).json({ error: "Worker file not found" });

      // Update the status to "failed" in the UploadHistory table
      await prisma.uploadHistory.update({
        where: { id: uploadHistory.id },
        data: { status: "failed" },
      });

      return;
    }

    // Start a worker thread to process the file
    const worker = new Worker(workerPath, {
      workerData: { fileUrl: (cloudinaryResult as any).secure_url }, // Pass the Cloudinary URL
    });

    worker.on("message", async (message) => {
      if (message.status === "log") {
        // Forward log updates to the frontend via SSE
        sendLogUpdate(uploadHistory.id, message.log);
      } else if (message.status === "progress") {
        // Optionally handle progress updates
        sendLogUpdate(uploadHistory.id, `Progress: ${message.progress}%`);
      } else if (message.status === "completed") {
        // Handle completion
        await prisma.uploadHistory.update({
          where: { id: uploadHistory.id },
          data: { status: "completed" },
        });
        res.status(200).json({
          success: true,
          message: "File processed successfully",
          stats: message.stats || {},
        });
      } else if (message.status === "error") {
        // Handle errors
        await prisma.uploadHistory.update({
          where: { id: uploadHistory.id },
          data: { status: "failed" },
        });
        res.status(500).json({
          success: false,
          message: message.error,
        });
      }
    });

    worker.on("error", async (error) => {
      console.error("Worker error:", error);

      // Update the status to "failed" in the UploadHistory table
      await prisma.uploadHistory.update({
        where: { id: uploadHistory.id },
        data: { status: "failed" },
      });

 
      res.status(500).json({
        success: false,
        message: "Error processing file",
      });
    });

    // Handle worker exit (unexpected termination)
    worker.on("exit", async (code) => {
      if (code !== 0) {
        console.error(`Worker exited with code ${code}. Marking upload as failed.`);

        // Update the status to "failed" in the UploadHistory table
        await prisma.uploadHistory.update({
          where: { id: uploadHistory.id },
          data: { status: "failed" },
        });

      
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Error uploading file" });
  }
};

// filepath: d:\Nexus\wekeyardashboard\server\src\controllers\uploadController.ts
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
      // Parse the ID as an integer
      const parsedId = parseInt(id, 10);

      if (isNaN(parsedId)) {
        res.status(400).json({ error: "Invalid ID format" });
        return;
      }

      // Delete a specific upload history record by ID
      const deletedRecord = await prisma.uploadHistory.delete({
        where: { id: parsedId },
      });

      res.status(200).json({ message: "Upload history record deleted successfully", deletedRecord });
    } else {
      // Delete all upload history records
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


const activeLogConnections: Map<number, Response> = new Map(); // Track active SSE connections by upload ID

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

  // Add the connection to the active connections map
  activeLogConnections.set(uploadId, res);

  // Handle client disconnect
  req.on("close", () => {
    activeLogConnections.delete(uploadId);
  });
};

// Function to send log updates to the client
export const sendLogUpdate = (uploadId: number, log: string): void => {
  const connection = activeLogConnections.get(uploadId);
  if (connection) {
    connection.write(`data: ${JSON.stringify({ log })}\n\n`);
  }
};



