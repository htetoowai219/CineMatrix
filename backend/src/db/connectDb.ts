import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MAX_ATTEMPTS = 10;
const RETRY_DELAY_MS = 3_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDb = async () => {
  const MONGO_URI = process.env.MONGO_URI;

  if (!MONGO_URI) {
    throw new Error("MONGO_URI missing.");
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const connectionRes = await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5_000,
      });
      console.log("Connected to Db : " + connectionRes.connection.host);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `MongoDB connection attempt ${attempt}/${MAX_ATTEMPTS} failed: ${message}`,
      );

      if (attempt === MAX_ATTEMPTS) {
        throw error;
      }

      await sleep(RETRY_DELAY_MS);
    }
  }
};

export default connectDb;
