import { Router } from "express";
import { getStoresUploadStatus } from "../controllers/test";

const router = Router();

router.get("/stores/upload-status", getStoresUploadStatus);

export default router;