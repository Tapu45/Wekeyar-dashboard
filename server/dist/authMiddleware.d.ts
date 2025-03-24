import { Request, Response, NextFunction } from "express";
interface CustomUser {
    id: number;
    username: string;
    email: string;
    role: string;
}
interface CustomRequest extends Request {
    user?: CustomUser;
}
export declare const authenticateUser: (req: CustomRequest, res: Response, next: NextFunction) => void;
export {};
