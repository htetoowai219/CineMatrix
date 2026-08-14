import { Types } from "mongoose";

export interface IScreeningTemplate {
  _id?: Types.ObjectId | string;
  cinemaId: Types.ObjectId | string;
  movieId: Types.ObjectId | string;
  roomName: string; // must match a room name on the cinema
  rowPrices: Record<string, number>; // { "A": 8, "B": 9, ... } per row label
  createdBy: Types.ObjectId | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
