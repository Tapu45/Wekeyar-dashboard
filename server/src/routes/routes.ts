import { Router } from "express";

const router = Router();
import {
  getSummary,
  getNonBuyingCustomers,
  getNonBuyingMonthlyCustomers,
  getCustomerReport,
  getStoreWiseSalesReport,
  getAllCustomers,
  getInactiveCustomers,
  getBillDetailsByBillNo,
} from "../controllers/reportController";

router.get("/summary", getSummary);
router.get("/non-buying-customers", getNonBuyingCustomers);
router.get("/non-buying-monthly-customers", getNonBuyingMonthlyCustomers);
router.get("/customer-report", getCustomerReport);
router.get("/store-sales-report", getStoreWiseSalesReport);
router.get("/customers", getAllCustomers);
router.get("/inactive-customers", getInactiveCustomers);
router.get("/bills/:billNo", getBillDetailsByBillNo);

export default router;
