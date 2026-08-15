import { Schema, model } from "mongoose";
import {
  ICinema,
  ICinemaRoom,
  ICinemaAnnouncement,
} from "../types/cinema.type";

const addressSchema = new Schema(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    state: { type: String, trim: true },
    country: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const locationSchema = new Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false },
);

const socialsSchema = new Schema(
  {
    website: { type: String, trim: true },
    facebook: { type: String, trim: true },
    instagram: { type: String, trim: true },
    twitter: { type: String, trim: true },
  },
  { _id: false },
);

const roomSchema = new Schema<ICinemaRoom>(
  {
    name: { type: String, required: true, trim: true },
    rows: { type: Number, required: true, min: 1 },
    cols: { type: Number, required: true, min: 1 },
    grid: {
      type: [[String]],
      required: true,
    },
  },
  { _id: false },
);

const announcementSchema = new Schema<ICinemaAnnouncement>(
  {
    title: { type: String, trim: true },
    body: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
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
    images: { type: [String], default: [] },
    gallery: { type: [String], default: [] },
    rooms: { type: [roomSchema], required: true, default: [] },
    announcements: { type: [announcementSchema], default: [] },
    socials: { type: socialsSchema, default: {} },
    allowPayInPerson: { type: Boolean, default: false },
    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP", "MMK", "THB", "SGD", "MYR", "IDR", "PHP", "VND", "INR", "JPY", "KRW", "AUD", "CAD"],
      default: "USD",
    },
    status: {
      type: String,
      enum: ["pending", "active", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true },
);

export const Cinema = model<Omit<ICinema, "_id">>("Cinema", cinemaSchema);
