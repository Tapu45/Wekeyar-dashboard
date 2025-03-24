import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";


export const login = async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;

  try {
    if (username === "admin" && password === "admin") {
      // Admin login
      const token = jwt.sign({ username, role: "admin" }, JWT_SECRET, {
        expiresIn: "7d",
      });
      res.json({ message: "Login successful", token });
    } else {
      // Check for tellecaller user in the database
      const user = await prisma.user.findUnique({ where: { username } });

      if (!user || !(await bcrypt.compare(password, user.password))) {
         res.status(401).json({ error: "Invalid username or password" });
         return;
      }

      if (user.role !== "tellecaller") {
         res.status(403).json({ error: "Unauthorized role" });
         return;
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
      );
     
      

      res.json({ message: "Login successful", token });
    }
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const isAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1]; // Get token from "Bearer <token>"

  if (!token) {
    res.status(403).json({ error: "Unauthorized access" });
  } else {
    try {
      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
      (req as any).user = decoded; // Attach user data to the request object
      next(); // Proceed to the next middleware/route
    } catch (err) {
      res.status(403).json({ error: "Invalid or expired token" });
    }
  }
};

export const logout = (_req: Request, res: Response) => {
  // Since JWTs are stateless, logout is handled on the client side by deleting the token
  res.json({ message: "Logout successful" });
};

export const checkAuth = (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.json({ authenticated: false });
  } else {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { username: string; role: string };
      res.json({ authenticated: true, role: decoded.role }); // Include role in the response
    } catch (err) {
      res.json({ authenticated: false });
    }
  }
};
