import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.model";
import { hashPassword } from "../utils/userAuth.util";

// Dev-only seed script.
// Creates a demo super admin and a demo cinema owner (whose _id is used when
// assigning a cinema's ownerId). Safe to re-run: existing users are left intact.
//
// Usage: npm run seed:admin

dotenv.config();

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@cinematrix.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@1234";
const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL || "owner@cinematrix.com";
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD || "Owner@1234";

const seed = async () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    throw new Error("MONGO_URI missing. Check backend/.env");
  }

  await mongoose.connect(MONGO_URI);
  console.log(`Connected to DB: ${mongoose.connection.host}`);

  let admin = await User.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    admin = new User({
      name: "Super Admin",
      email: ADMIN_EMAIL,
      phone: "+1 (555) 000-0001",
      password: await hashPassword(ADMIN_PASSWORD),
      role: "admin",
    });
    await admin.save();
    console.log(`Created admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } else {
    // Idempotent seed: keep documented credentials working even if the user
    // already exists with a stale password.
    admin.password = await hashPassword(ADMIN_PASSWORD);
    await admin.save();
    console.log(`Synced admin credentials: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  }

  let owner = await User.findOne({ email: OWNER_EMAIL });
  if (!owner) {
    owner = new User({
      name: "Demo Cinema Owner",
      email: OWNER_EMAIL,
      phone: "+1 (555) 000-0002",
      password: await hashPassword(OWNER_PASSWORD),
      role: "cinema_owner",
    });
    await owner.save();
    console.log(`Created cinema owner: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  } else {
    owner.password = await hashPassword(OWNER_PASSWORD);
    await owner.save();
    console.log(`Synced cinema owner credentials: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  }

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
