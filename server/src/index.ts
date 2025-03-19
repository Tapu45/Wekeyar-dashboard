import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes";
import routes from "./routes/routes";

const app = express();

app.use(express.json()); // To parse JSON request bodies
app.use(cookieParser()); // To parse cookies


app.use(cors({ origin: "*" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/reports", routes);
app.use("/auth", authRoutes); //

app.get("/health-check", (_: Request, res: Response) => {
  res.status(200).json({ status: true, message: "Service is healthy" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`⚡️[server]: Server is listening on port ${port}!`);
});
