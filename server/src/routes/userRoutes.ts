import express from "express";
import { createUser } from "../controllers/userController";

const router = express.Router();

// Route to create a new user
router.post("/create-user", createUser);

export default router;