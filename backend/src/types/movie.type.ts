import { Types } from "mongoose";

export type MovieStatus =
  | "UPCOMING"
  | "NOW_SHOWING"
  | "ARCHIVED"
  | "PENDING_APPROVAL";

export interface IMovie {
  _id?: Types.ObjectId | string;
  title: string;
  tagline?: string;
  synopsis: string;
  durationMinutes: number;
  releaseDate: Date;
  originalLanguage: string;
  contentRating: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  director: string;
  castMembers?: string[];
  genres?: string[];
  status: MovieStatus;
  createdByCinemaId?: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
}
