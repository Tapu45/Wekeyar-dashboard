"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const routes_1 = __importDefault(require("./routes/routes"));
const upload_route_1 = __importDefault(require("./routes/upload.route"));
const http_1 = __importDefault(require("http"));
const Websocket_1 = require("./utils/Websocket");
const client_1 = require("@prisma/client");
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({ origin: "*" }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/reports", routes_1.default);
app.use("/api", upload_route_1.default);
app.use("/auth", authRoutes_1.default);
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({
        error: "Something went wrong!",
        message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
});
const cleanupInterruptedUploads = async () => {
    try {
        console.log("Cleaning up interrupted uploads...");
        const result = await prisma.uploadHistory.updateMany({
            where: { status: "in-progress" },
            data: { status: "failed" },
        });
        console.log(`Cleanup completed. Marked ${result.count} interrupted uploads as failed.`);
    }
    catch (error) {
        console.error("Error during cleanup of interrupted uploads:", error);
    }
};
cleanupInterruptedUploads().then(() => {
    const server = http_1.default.createServer(app);
    (0, Websocket_1.initializeWebSocketServer)(server);
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        console.log(`⚡️[server]: Server is listening on port ${port}!`);
    });
});
exports.default = app;
//# sourceMappingURL=index.js.map