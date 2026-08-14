import { Types } from "mongoose";

export type ScreeningSeatStatus = "available" | "held" | "booked";

export interface IScreeningSeat {
  label: string; // e.g. "A3"
  row: string; // e.g. "A"
  isDouble: boolean;
  price: number;
  status: ScreeningSeatStatus;
}

export interface IScreening {
  _id?: Types.ObjectId | string;
  templateId: Types.ObjectId | string;
  cinemaId: Types.ObjectId | string;
  movieId: Types.ObjectId | string;
  roomName: string;
  startTime: Date | string;
  endTime: Date | string;
  seats: IScreeningSeat[];
  createdBy: Types.ObjectId | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
