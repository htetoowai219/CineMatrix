import { Schema, model } from "mongoose";
import { IBooking, IBookingSeat } from "../types/booking.type";

const bookingSeatSchema = new Schema<IBookingSeat>(
  {
    label: { type: String, required: true, trim: true },
    row: { type: String, required: true, trim: true },
    isDouble: { type: Boolean, required: true, default: false },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const bookingSchema = new Schema<Omit<IBooking, "_id">>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    screeningId: {
      type: Schema.Types.ObjectId,
      ref: "Screening",
      required: true,
      index: true,
    },
    seats: { type: [bookingSeatSchema], required: true },
    totalPrice: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["screenshot", "in_person"],
      required: true,
    },
    paymentScreenshotUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    notes: { type: String, trim: true },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

bookingSchema.index({ screeningId: 1, status: 1 });
// TTL safety net: pending bookings past their payment window are purged by
// MongoDB. The sweeper normally releases seats and cancels them first.
bookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Booking = model<Omit<IBooking, "_id">>(
  "Booking",
  bookingSchema,
);
