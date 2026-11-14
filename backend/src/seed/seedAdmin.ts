import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.model";
import { hashPassword } from "../utils/userAuth.util";
import type { UserRole } from "../types/user.type";

// Dev-only seed script.
// Creates exactly one demo account for each role. Nothing else (movies,
// cinemas, screenings, bookings, etc.) is seeded. Safe to re-run: existing
// accounts with the same email are updated in place.
//
// Usage: npm run seed:admin

dotenv.config();

type SeedUser = {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  managedByOwnerId?: mongoose.Types.ObjectId;
};

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@gmail.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@1234";
const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL || "owner@gmail.com";
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD || "Owner@1234";
const STAFF_EMAIL = process.env.SEED_STAFF_EMAIL || "staff@gmail.com";
const STAFF_PASSWORD = process.env.SEED_STAFF_PASSWORD || "Staff@1234";
const CUSTOMER_EMAIL = process.env.SEED_CUSTOMER_EMAIL || "customer@gmail.com";
const CUSTOMER_PASSWORD = process.env.SEED_CUSTOMER_PASSWORD || "Customer@1234";

const upsertUser = async (input: SeedUser) => {
  const existing = await User.findOne({ email: input.email });

  if (existing) {
    // Idempotent seed: keep the documented credentials working even if the
    // account already exists with a stale password.
    existing.set({
      name: input.name,
      phone: input.phone,
      role: input.role,
      password: await hashPassword(input.password),
      ...(input.managedByOwnerId
        ? { managedByOwnerId: input.managedByOwnerId }
        : {}),
    });
    await existing.save();
    console.log(`Synced ${input.role}: ${input.email} / ${input.password}`);
    return existing;
  }

  const user = new User({
    ...input,
    password: await hashPassword(input.password),
  });
  await user.save();
  console.log(`Created ${input.role}: ${input.email} / ${input.password}`);
  return user;
};

const seed = async () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    throw new Error("MONGO_URI missing. Check backend/.env");
  }

  await mongoose.connect(MONGO_URI);
  console.log(`Connected to DB: ${mongoose.connection.host}`);

  const owner = await upsertUser({
    name: "Demo Cinema Owner",
    email: OWNER_EMAIL,
    phone: "+1 (555) 000-0002",
    password: OWNER_PASSWORD,
    role: "cinema_owner",
  });

  await upsertUser({
    name: "Demo Cinema Staff",
    email: STAFF_EMAIL,
    phone: "+1 (555) 000-0004",
    password: STAFF_PASSWORD,
    role: "cinema_staff",
    managedByOwnerId: owner._id,
  });

  await upsertUser({
    name: "Demo Customer",
    email: CUSTOMER_EMAIL,
    phone: "+1 (555) 000-0003",
    password: CUSTOMER_PASSWORD,
    role: "customer",
  });

  await upsertUser({
    name: "Demo Admin",
    email: ADMIN_EMAIL,
    phone: "+1 (555) 000-0001",
    password: ADMIN_PASSWORD,
    role: "admin",
  });

  console.log("");
  console.log("Use this owner _id as the cinema 'Owner ID' when creating cinemas:");
  console.log(owner._id.toString());

  await mongoose.disconnect();
  console.log("Seed complete.");
};

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
