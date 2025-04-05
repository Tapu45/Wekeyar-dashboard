"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postDailyBills = postDailyBills;
const client_1 = require("@prisma/client");
async function postDailyBills(req, res) {
    const prisma = new client_1.PrismaClient();
    const { bill } = req.body;
    try {
        if (!bill) {
            console.log("Invalid request body", bill);
            res.status(400).json({ error: "Invalid request body" });
            return;
        }
        console.log("Creating bill", bill);
        res.status(200).json({ success: true });
        return;
    }
    catch (error) {
        res.status(500).json({ error: "Failed to create bill" });
        return;
    }
    finally {
        await prisma.$disconnect();
    }
}
//# sourceMappingURL=billController.js.map