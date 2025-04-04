import { Request, Response } from 'express';
export declare const uploadExcelFile: (req: Request, res: Response) => Promise<void>;
export declare const getUploadHistory: (_req: Request, res: Response) => Promise<void>;
export declare const deleteUploadHistory: (req: Request, res: Response) => Promise<void>;
export declare const getUploadStatus: (req: Request, res: Response) => Promise<void>;
export declare const uploadLogsSSE: (req: Request, res: Response) => void;
export declare const sendLogUpdate: (uploadId: number, log: string) => void;
