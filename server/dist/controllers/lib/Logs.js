"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogs = getLogs;
const path_1 = __importDefault(require("path"));
async function getLogs(req, res) {
    try {
        const { type } = req.query;
        if (type && type == "error") {
            const filePath = path_1.default.join(__dirname, "../../../logs", "error.log");
            res.download(filePath);
        }
        else {
            const filePath = path_1.default.join(__dirname, "../../../logs", "combined.log");
            res.download(filePath);
        }
    }
    catch (error) {
        console.error("Error reading log file:", error);
        res.status(500).json({ error: "Failed to read logs" });
    }
}
//# sourceMappingURL=Logs.js.map