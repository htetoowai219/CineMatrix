import { Types } from "mongoose";

export type UserRole = "customer" | "cinema_owner" | "cinema_staff" | "admin";

export interface IUser {
  _id?: Types.ObjectId | string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string;
  profileImageUrl?: string;
  managedByOwnerId?: Types.ObjectId | string;
  refreshToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
