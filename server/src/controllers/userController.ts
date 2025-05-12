import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password, role } = req.body;

  // Validate input
  if (!username || !email || !password || !role) {
   res.status(400).json({ error: "All fields are required" });
    return;
  }

  try {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user in the database
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role, // e.g., "report-access"
      },
    });

    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error(error);
    if ((error as any).code === "P2002") {
      // Handle unique constraint violation (e.g., duplicate email or username)
     res.status(409).json({ error: "Username or email already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to create user" });
  }
};