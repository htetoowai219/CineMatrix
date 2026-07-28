import express, { type Express, type Request, type Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDb from "./db/connectDb";

import userRoutes from "./routes/user.routes";

dotenv.config();

const app: Express = express();

const PORT = process.env.PORT || 3000;
const frontendClient = process.env.FRONTEND_CLIENT;
const frontendAdmin = process.env.FRONTEND_ADMIN;
if (!frontendClient) {
  throw new Error("FRONTEND_CLIENT environment variable is missing");
}
if (!frontendAdmin) {
  throw new Error("FRONTEND_ADMIN environment variable is missing");
}

app.use(
  cors({
    origin: [frontendClient, frontendAdmin],
    credentials: true,
  }),
);
app.use(express.json());

app.use("/user", userRoutes);

const start = async () => {
  await connectDb();

  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
};

start();
