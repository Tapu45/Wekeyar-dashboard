import express, { Request, Response } from "express";
import cors from "cors";
import routes from "./routes/routes";

const app = express();

// Enable CORS for all routes
app.use(cors());

app.use("/api", routes);

app.get("/health-check", (_: Request, res: Response) => {
  res.status(200).json({ status: true, message: "Service is healthy" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`⚡️[server]: Server is listening on port ${port}!`);
});