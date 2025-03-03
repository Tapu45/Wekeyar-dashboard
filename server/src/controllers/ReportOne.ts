import { Request, Response } from "express";

export const reportOne = (_: Request, res: Response) => {
  res.status(200).json({ status: true, message: "Report One" });
};
