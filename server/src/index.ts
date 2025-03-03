import express, { Request, Response } from "express";

const app = express();

app.get("/health-check", (_: Request, res: Response) => {
  res.status(200).json({ status: true, message: "Service is healthy" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`⚡️[server]: Server is listening on port ${port}!`);
});
