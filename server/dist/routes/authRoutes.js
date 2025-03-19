"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const authController_1 = require("../controllers/authController");
router.post("/login", authController_1.login);
router.get("/logout", authController_1.logout);
router.get("/check-auth", authController_1.checkAuth);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map