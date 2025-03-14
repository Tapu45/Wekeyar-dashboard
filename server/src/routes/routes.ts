import { Router } from "express";

const router = Router();
import {
  getSummary,
  getNonBuyingCustomers,
  getNonBuyingMonthlyCustomers,
} from "../controllers/reportController";

router.get("/summary", getSummary);
router.get("/non-buying-customers", getNonBuyingCustomers);
router.get("/non-buying-monthly-customers", getNonBuyingMonthlyCustomers);

export default router;
