import { Schema, model } from "mongoose";
import { ICinema } from "../types/cinema.type";

const addressSchema = new Schema(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    state: { type: String, trim: true },
    country: { type: String, required: true, trim: true },
    zipCode: { type: String, trim: true },
  },
  { _id: false },
);

const locationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  { _id: false },
);

const cinemaSchema = new Schema<Omit<ICinema, "_id">>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    address: { type: addressSchema, required: true },
    location: { type: locationSchema },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    amenities: { type: [String], default: [], index: true },
    images: { type: [String], default: [] },
    totalScreens: { type: Number, required: true, min: 1, default: 1 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

cinemaSchema.index({ location: "2dsphere" });

export const Cinema = model<Omit<ICinema, "_id">>("Cinema", cinemaSchema);
