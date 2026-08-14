import { Schema, model } from "mongoose";
import { IScreening, IScreeningSeat } from "../types/screening.type";

const seatSchema = new Schema<IScreeningSeat>(
  {
    label: { type: String, required: true, trim: true },
    row: { type: String, required: true, trim: true },
    isDouble: { type: Boolean, required: true, default: false },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["available", "held", "booked"],
      default: "available",
    },
  },
  { _id: false },
);

const screeningSchema = new Schema<Omit<IScreening, "_id">>(
  {
    templateId: {
      type: Schema.Types.ObjectId,
      ref: "ScreeningTemplate",
      required: true,
      index: true,
    },
    cinemaId: {
      type: Schema.Types.ObjectId,
      ref: "Cinema",
      required: true,
      index: true,
    },
    movieId: {
      type: Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
      index: true,
    },
    roomName: { type: String, required: true, trim: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    seats: { type: [seatSchema], required: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

screeningSchema.index({ cinemaId: 1, startTime: 1 });

export const Screening = model<Omit<IScreening, "_id">>(
  "Screening",
  screeningSchema,
);
