import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";
import type { UserRole } from "../../../common/types/user.type";

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  _id!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  @Prop({ type: String, required: true, trim: true })
  phone!: string;

  @Prop({ type: String, required: true })
  password!: string;

  @Prop({ type: String, trim: true })
  profileImageUrl?: string;

  @Prop({
    type: String,
    enum: ["customer", "cinema_owner", "cinema_staff", "admin"],
    default: "customer",
  })
  role!: UserRole;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: "User" })
  managedByOwnerId?: Types.ObjectId;

  @Prop({ type: String })
  refreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
