"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAuth = exports.logout = exports.isAuth = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        if (username === "admin" && password === "admin") {
            const token = jsonwebtoken_1.default.sign({ username, role: "admin" }, JWT_SECRET, {
                expiresIn: "7d",
            });
            res.json({ message: "Login successful", token });
        }
        else {
            const user = await prisma.user.findUnique({ where: { username } });
            if (!user || !(await bcrypt_1.default.compare(password, user.password))) {
                res.status(401).json({ error: "Invalid username or password" });
                return;
            }
            if (user.role !== "tellecaller") {
                res.status(403).json({ error: "Unauthorized role" });
                return;
            }
            const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
            res.json({ message: "Login successful", token });
        }
    }
    catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.login = login;
const isAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        res.status(403).json({ error: "Unauthorized access" });
    }
    else {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            req.user = decoded;
            next();
        }
        catch (err) {
            res.status(403).json({ error: "Invalid or expired token" });
        }
    }
};
exports.isAuth = isAuth;
const logout = (_req, res) => {
    res.json({ message: "Logout successful" });
};
exports.logout = logout;
const checkAuth = (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        res.json({ authenticated: false });
    }
    else {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            res.json({ authenticated: true, role: decoded.role });
        }
        catch (err) {
            res.json({ authenticated: false });
        }
    }
};
exports.checkAuth = checkAuth;
//# sourceMappingURL=authController.js.map