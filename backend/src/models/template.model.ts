import { Schema, model } from "mongoose";
import { IScreeningTemplate } from "../types/template.type";

const templateSchema = new Schema<Omit<IScreeningTemplate, "_id">>(
  {
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
    rowPrices: { type: Map, of: Number, required: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export const ScreeningTemplate = model<Omit<IScreeningTemplate, "_id">>(
  "ScreeningTemplate",
  templateSchema,
);
