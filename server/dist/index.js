"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes/routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: "*" }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/reports", routes_1.default);
app.get("/health-check", (_, res) => {
    res.status(200).json({ status: true, message: "Service is healthy" });
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`⚡️[server]: Server is listening on port ${port}!`);
});
//# sourceMappingURL=index.js.map