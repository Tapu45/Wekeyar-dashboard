"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const reportController_1 = require("../controllers/reportController");
router.get("/summary", reportController_1.getSummary);
router.get("/non-buying-customers", reportController_1.getNonBuyingCustomers);
router.get("/non-buying-monthly-customers", reportController_1.getNonBuyingMonthlyCustomers);
exports.default = router;
//# sourceMappingURL=routes.js.map