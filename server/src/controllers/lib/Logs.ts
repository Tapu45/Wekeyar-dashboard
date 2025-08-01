import path from "path";
import { Request, Response } from "express";

export async function getLogs(req: Request, res: Response): Promise<void> {
  try {
    const { type } = req.query;
    if (type && type == "error") {
      const filePath = path.join(__dirname, "../../../logs", "error.log");
      res.download(filePath);
    }
    else {
      const filePath = path.join(__dirname, "../../../logs", "combined.log");
      res.download(filePath);
    }
  } catch (error) {
    console.error("Error reading log file:", error);
    res.status(500).json({ error: "Failed to read logs" });
  }
}