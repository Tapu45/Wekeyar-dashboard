import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Get all stores with their data upload status
export const getStoresUploadStatus = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of the day

    // Fetch all stores with their latest upload status
    const stores = await prisma.store.findMany({
      include: {
        dailySales: {
          where: { date: { lte: today } }, // Fetch only data up to today
          orderBy: { lastUpdated: "desc" }, // Get latest updated record
          take: 1, // Only the latest entry
        },
      },
    });
    console.log(stores);
    // Format response
    const storeData = stores.map((store) => {
      const latestSales = store.dailySales[0] || null;

      return {
        id: store.id,
        name: store.name,
        location: store.location || "N/A",
        currentDate: today.toISOString().split("T")[0], // Return YYYY-MM-DD format
        dataUploaded: latestSales
          ? latestSales.uploaded
            ? "Yes"
            : "No"
          : "No",
        lastUpdated: latestSales
          ? latestSales.lastUpdated.toISOString()
          : "N/A",
      };
    });
    console.log("Store data:", storeData);

    res.status(200).json(storeData);
  } catch (error) {
    console.error("Error fetching store upload status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
