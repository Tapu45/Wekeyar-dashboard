import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import routes from "./routes/routes";
import uploadRoutes from "./routes/upload.route";
import path from "path";
import fs from "fs";
import http from "http"; // Import HTTP module
import { initializeWebSocketServer } from "./utils/Websocket"; // Import WebSocket server
import { PrismaClient } from "@prisma/client"; // Import PrismaClient

const app = express();
const prisma = new PrismaClient();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.json()); // To parse JSON request bodies
app.use(cookieParser()); // To parse cookies


app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/reports", routes);
app.use("/api", uploadRoutes);
app.use("/auth", authRoutes); //

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Cleanup function to mark interrupted uploads as failed
const cleanupInterruptedUploads = async () => {
  try {
    console.log("Cleaning up interrupted uploads...");
    const result = await prisma.uploadHistory.updateMany({
      where: { status: "in-progress" },
      data: { status: "failed" },
    });
    console.log(`Cleanup completed. Marked ${result.count} interrupted uploads as failed.`);
  } catch (error) {
    console.error("Error during cleanup of interrupted uploads:", error);
  }
};

// Call the cleanup function before starting the server
cleanupInterruptedUploads().then(() => {
  const server = http.createServer(app);

  // Initialize WebSocket server
  initializeWebSocketServer(server);

  // Start the server
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`⚡️[server]: Server is listening on port ${port}!`);
  });
});

export default app;