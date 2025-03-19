import { Router } from "express";
const router = Router();
import { checkAuth, login, logout } from "../controllers/authController";

router.post("/login", login);
router.get("/logout", logout);
router.get("/check-auth", checkAuth);

export default router;