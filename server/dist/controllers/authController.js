"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAuth = exports.logout = exports.isAuth = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const login = async (req, res) => {
    const { username, password } = req.body;
    if (username === "admin" && password === "admin") {
        const token = jsonwebtoken_1.default.sign({ username }, JWT_SECRET, {
            expiresIn: "7d",
        });
        res.json({ message: "Login successful", token });
    }
    else {
        res.status(401).json({ error: "Invalid username or password" });
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
            jsonwebtoken_1.default.verify(token, JWT_SECRET);
            res.json({ authenticated: true });
        }
        catch (err) {
            res.json({ authenticated: false });
        }
    }
};
exports.checkAuth = checkAuth;
//# sourceMappingURL=authController.js.map