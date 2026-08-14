import express, {
  application,
  type Express,
  type Request,
  type Response,
} from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDb from "./db/connectDb";

import userRoutes from "./routes/user.route";
import movieRoutes from "./routes/movie.route";
import cinemaRoutes from "./routes/cinema.route";
import templateRoutes from "./routes/template.route";
import screeningRoutes from "./routes/screening.route";
import bookingRoutes from "./routes/booking.route";
import {
  reconcileExpiredSeatLocks,
  expirePendingBookings,
} from "./controllers/booking.controller";
import { connectRedis, isRedisAvailable } from "./utils/redis.util";

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
app.use("/movie", movieRoutes);
app.use("/cinema", cinemaRoutes);
app.use("/template", templateRoutes);
app.use("/screening", screeningRoutes);
app.use("/booking", bookingRoutes);

const start = async () => {
  await connectDb();

  // Best-effort Redis warm-up (seat locks). The lock endpoints tolerate a
  // missing Redis by surfacing 503, so a cold start never blocks the server.
  try {
    await connectRedis();
    if (isRedisAvailable()) {
      console.log("Connected to Redis");
    }
  } catch (error) {
    console.error("Redis warm-up failed:", error);
  }

  // Periodic maintenance: release seats whose 10-minute lock expired and cancel
  // pending bookings that outlived their payment window.
  setInterval(() => {
    void reconcileExpiredSeatLocks();
    void expirePendingBookings();
  }, 30_000);

  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
};

start();
