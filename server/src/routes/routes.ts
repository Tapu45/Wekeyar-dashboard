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
  getUploadStatusByMonth,
} from "../controllers/reportController";
import { getCustomerPurchaseHistory } from "../controllers/reportController";

router.get("/summary", getSummary);
router.get("/non-buying-customers", getNonBuyingCustomers);
router.get("/non-buying-monthly-customers", getNonBuyingMonthlyCustomers);
router.get("/customer-report", getCustomerReport);
router.get("/store-sales-report", getStoreWiseSalesReport);
router.get("/customers", getAllCustomers);
router.get("/inactive-customers", getInactiveCustomers);
router.get("/bills/:billNo", getBillDetailsByBillNo);
router.get("/upload-status", getUploadStatusByMonth);


router.get("/customer/:customerId/purchase-history", getCustomerPurchaseHistory);


export default router;
