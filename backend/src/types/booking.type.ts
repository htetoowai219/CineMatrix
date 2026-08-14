import { Types } from "mongoose";

export type BookingPaymentMethod = "screenshot" | "in_person";
export type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled";

export interface IBookingSeat {
  label: string; // e.g. "A3"
  row: string; // e.g. "A"
  isDouble: boolean;
  price: number;
}

export interface IBooking {
  _id?: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  screeningId: Types.ObjectId | string;
  seats: IBookingSeat[];
  totalPrice: number;
  paymentMethod: BookingPaymentMethod;
  paymentScreenshotUrl?: string;
  status: BookingStatus;
  notes?: string;
  expiresAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
