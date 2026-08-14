import { Schema, model } from "mongoose";
import { IMovie } from "../types/movie.type";

const movieSchema = new Schema<Omit<IMovie, "_id">>(
  {
    title: { type: String, required: true, trim: true },
    tagline: { type: String, trim: true },
    synopsis: { type: String, required: true, trim: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    releaseDate: { type: Date, required: true },
    originalLanguage: { type: String, required: true, trim: true },
    contentRating: { type: String, required: true, trim: true },
    posterUrl: { type: String, required: true, trim: true },
    backdropUrl: { type: String, required: true, trim: true },
    trailerUrl: { type: String, trim: true },
    director: { type: String, required: true, trim: true },
    castMembers: { type: [String], default: [] },
    genres: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["UPCOMING", "NOW_SHOWING", "ARCHIVED", "PENDING_APPROVAL"],
      default: "UPCOMING",
    },
    createdByCinemaId: { type: Schema.Types.ObjectId, ref: "Cinema" },
  },
  { timestamps: true },
);

export const Movie = model<Omit<IMovie, "_id">>("Movie", movieSchema);
