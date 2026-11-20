import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";
import type { MovieStatus } from "../../../common/types/movie.type";

export type MovieDocument = HydratedDocument<Movie>;

@Schema({ timestamps: true })
export class Movie {
  _id!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String, trim: true })
  tagline?: string;

  @Prop({ type: String, required: true, trim: true })
  synopsis!: string;

  @Prop({ type: Number, required: true, min: 1 })
  durationMinutes!: number;

  @Prop({ type: Date, required: true })
  releaseDate!: Date;

  @Prop({ type: String, required: true, trim: true })
  originalLanguage!: string;

  @Prop({ type: String, required: true, trim: true })
  contentRating!: string;

  @Prop({ type: String, required: true, trim: true })
  posterUrl!: string;

  @Prop({ type: String, required: true, trim: true })
  backdropUrl!: string;

  @Prop({ type: String, trim: true })
  trailerUrl?: string;

  @Prop({ type: String, required: true, trim: true })
  director!: string;

  @Prop({ type: [String], default: [] })
  castMembers?: string[];

  @Prop({ type: [String], default: [] })
  genres?: string[];

  @Prop({
    type: String,
    enum: ["UPCOMING", "NOW_SHOWING", "ARCHIVED", "PENDING_APPROVAL"],
    default: "UPCOMING",
  })
  status!: MovieStatus;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "Cinema" })
  createdByCinemaId?: Types.ObjectId;
}

export const MovieSchema = SchemaFactory.createForClass(Movie);
