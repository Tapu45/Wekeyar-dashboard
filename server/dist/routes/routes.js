"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const reportController_1 = require("../controllers/reportController");
const reportController_2 = require("../controllers/reportController");
router.get("/summary", reportController_1.getSummary);
router.get("/non-buying-customers", reportController_1.getNonBuyingCustomers);
router.get("/non-buying-monthly-customers", reportController_1.getNonBuyingMonthlyCustomers);
router.get("/customer-report", reportController_1.getCustomerReport);
router.get("/store-sales-report", reportController_1.getStoreWiseSalesReport);
router.get("/customers", reportController_1.getAllCustomers);
router.get("/inactive-customers", reportController_1.getInactiveCustomers);
router.get("/bills/:billNo", reportController_1.getBillDetailsByBillNo);
router.get("/upload-status", reportController_1.getUploadStatusByMonth);
router.get("/customer/:customerId/purchase-history", reportController_2.getCustomerPurchaseHistory);
exports.default = router;
//# sourceMappingURL=routes.js.map