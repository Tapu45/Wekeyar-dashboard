import { Request, Response } from 'express';
export declare const uploadExcelFile: (req: Request, res: Response) => Promise<void>;
export declare const processExcelFileSync: (req: Request, res: Response) => Promise<void>;
export declare const getUploadHistory: (_req: Request, res: Response) => Promise<void>;
export declare const deleteUploadHistory: (req: Request, res: Response) => Promise<void>;
export declare const getUploadStatus: (req: Request, res: Response) => Promise<void>;
