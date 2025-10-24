import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import routes from "./routes/routes";
import uploadRoutes from "./routes/upload.route";
import userRoutes from "./routes/userRoutes";
import tellicallingRoutes from "./routes/telicallingRoutes";
import dotenv from "dotenv";
import http from "http"; // Import HTTP module
import { PrismaClient } from "@prisma/client"; // Import PrismaClient
import setupSocketIO from "./utils/Socket";
import { Server } from "socket.io";
import productRoutes from "./routes/productRoute";

const app = express();
const prisma = new PrismaClient();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins (adjust for production)
    methods: ["GET", "POST"],
  },
});

// Create uploads directory if it doesn't exist
// const uploadsDir = path.join(__dirname, "../uploads");
// if (!fs.existsSync(uploadsDir)) {
//   fs.mkdirSync(uploadsDir, { recursive: true });
// }
dotenv.config();
app.use(express.json()); // To parse JSON request bodies
app.use(cookieParser()); // To parse cookies


app.use(cors({ origin: "*" }));
app.use(express.json({limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

setupSocketIO(io);

app.use("/reports", routes);
app.use("/api", uploadRoutes);
app.use("/auth", authRoutes); 
app.use("/user", userRoutes);
app.use("/telecalling", tellicallingRoutes);
app.use("/products", productRoutes);

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
 
  // Start the server
  const port = process.env.PORT || 4000;
  server.listen(port, () => {
    console.log(`⚡️[server]: Server is listening on port ${port}!`);
  });
});

export default app;