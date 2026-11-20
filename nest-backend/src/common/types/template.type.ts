import { Types } from "mongoose";

export interface IScreeningTemplate {
  _id?: Types.ObjectId | string;
  cinemaId: Types.ObjectId | string;
  movieId: Types.ObjectId | string;
  roomName: string;
  rowPrices: Record<string, number> | Map<string, number>;
  createdBy: Types.ObjectId | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
