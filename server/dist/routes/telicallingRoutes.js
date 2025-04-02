"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const tellicallingController_1 = require("../controllers/tellicallingController");
const authMiddleware_1 = require("../authMiddleware");
const router = express_1.default.Router();
router.get("/customers", tellicallingController_1.getTelecallingCustomers);
router.get("/products", tellicallingController_1.getProducts);
router.post("/orders", authMiddleware_1.authenticateUser, tellicallingController_1.saveTelecallingOrder);
router.get("/telecallers-with-orders", tellicallingController_1.getTelecallersWithOrderCount);
router.get("/telecalling-orders", tellicallingController_1.getAllTelecallingOrders);
router.get("/new-products", tellicallingController_1.getNewProducts);
router.patch("/customers/:id/remarks", authMiddleware_1.authenticateUser, tellicallingController_1.updateCustomerRemarks);
router.get("/telecaller/remarks-orders", authMiddleware_1.authenticateUser, tellicallingController_1.getTelecallerRemarksOrders);
router.post("/customers/new", tellicallingController_1.addNewTelecallingCustomer);
exports.default = router;
//# sourceMappingURL=telicallingRoutes.js.map