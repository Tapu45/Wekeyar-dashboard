import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
interface CustomUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface CustomRequest extends Request {
  user?: CustomUser;
}

export const authenticateUser = (req: CustomRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from Authorization header

  if (!token) {
    res.status(401).json({ error: "Unauthorized. Token not provided." });
    return;
  }


  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as CustomUser;
  console.log("decoded",decoded);
  

    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    }; // Attach only the required fields

    next();
  } catch (error) {
    console.error("Invalid token:", error);
    res.status(401).json({ error: "Unauthorized. Invalid token." });
  }
};