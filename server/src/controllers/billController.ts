import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";


export async function postDailyBills(req: Request, res: Response){
  const prisma = new PrismaClient();
  const { bill } = req.body;

  try {
    // validate body
    if (!bill) {
      console.log("Invalid request body", bill);
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    // create the bill
    console.log("Creating bill", bill);

    res.status(200).json({ success: true });
    return;
  } catch (error) {
    res.status(500).json({ error: "Failed to create bill" });
    return;
  } finally {
    await prisma.$disconnect();
  }
}