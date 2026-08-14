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
    profileImageUrl: { type: String, trim: true },
    role: {
      type: String,
      enum: ["customer", "cinema_owner", "cinema_staff", "admin"],
      default: "customer",
    },
    managedByOwnerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    refreshToken: { type: String },
  },
  { timestamps: true },
);

export const User = model<Omit<IUser, "_id">>("User", userSchema);
