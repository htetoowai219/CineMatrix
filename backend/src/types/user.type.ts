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
  // For cinema_staff: the owner account this staff member reports to.
  // Staff can then manage every cinema owned by that owner.
  managedByOwnerId?: Types.ObjectId | string;
  refreshToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
