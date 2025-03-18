import { Router } from "express";

const router = Router();
import {
  getSummary,
  getNonBuyingCustomers,
  getNonBuyingMonthlyCustomers,
  getCustomerReport,
  getStoreWiseSalesReport,
  getAllCustomers,
  getYearlyRevenue,
  getMonthlyRevenue,
  getAvailableYears,
} from "../controllers/reportController";

router.get("/summary", getSummary);
router.get("/non-buying-customers", getNonBuyingCustomers);
router.get("/non-buying-monthly-customers", getNonBuyingMonthlyCustomers);
router.get("/customer-report", getCustomerReport);
router.get("/store-sales-report", getStoreWiseSalesReport);
router.get("/customers", getAllCustomers);
router.get('/yearly', getYearlyRevenue);

// Get monthly revenue data for a specific year
router.get('/monthly/:year', getMonthlyRevenue);

// Get available years for filtering
router.get('/years', getAvailableYears);

export default router;
