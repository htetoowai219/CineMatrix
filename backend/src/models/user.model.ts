import { Schema, model } from "mongoose";
import { IUser } from "../types/user.type";

const userSchema = new Schema<Omit<IUser, "_id">>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "cinema_owner", "admin"],
      default: "customer",
    },
    refreshToken: { type: String },
  },
  { timestamps: true },
);

export const User = model<Omit<IUser, "_id">>("User", userSchema);
