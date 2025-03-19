import { Request, Response, NextFunction } from "express";
export declare const login: (req: Request, res: Response) => Promise<void>;
export declare const isAuth: (req: Request, res: Response, next: NextFunction) => void;
export declare const logout: (_req: Request, res: Response) => void;
export declare const checkAuth: (req: Request, res: Response) => void;
