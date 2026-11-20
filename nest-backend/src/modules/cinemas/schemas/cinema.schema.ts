import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";
import {
  CURRENCIES,
  type CinemaStatus,
  type CurrencyCode,
  type ICinemaAddress,
  type ICinemaAnnouncement,
  type ICinemaLocation,
  type ICinemaRoom,
  type ICinemaSocials,
  type SeatCellType,
} from "../../../common/types/cinema.type";

export type CinemaDocument = HydratedDocument<Cinema>;

@Schema({ _id: false })
export class CinemaAddress implements ICinemaAddress {
  @Prop({ type: String, required: true, trim: true })
  street!: string;

  @Prop({ type: String, required: true, trim: true, index: true })
  city!: string;

  @Prop({ type: String, trim: true })
  state?: string;

  @Prop({ type: String, required: true, trim: true })
  country!: string;
}
export const CinemaAddressSchema = SchemaFactory.createForClass(CinemaAddress);

@Schema({ _id: false })
export class CinemaLocation implements ICinemaLocation {
  @Prop({ type: Number, required: true })
  lat!: number;

  @Prop({ type: Number, required: true })
  lng!: number;
}
export const CinemaLocationSchema = SchemaFactory.createForClass(CinemaLocation);

@Schema({ _id: false })
export class CinemaSocials implements ICinemaSocials {
  @Prop({ type: String, trim: true })
  website?: string;

  @Prop({ type: String, trim: true })
  facebook?: string;

  @Prop({ type: String, trim: true })
  instagram?: string;

  @Prop({ type: String, trim: true })
  twitter?: string;
}
export const CinemaSocialsSchema = SchemaFactory.createForClass(CinemaSocials);

@Schema({ _id: false })
export class CinemaRoom implements ICinemaRoom {
  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: Number, required: true, min: 1 })
  rows!: number;

  @Prop({ type: Number, required: true, min: 1 })
  cols!: number;

  @Prop({ type: [[String]], required: true })
  grid!: SeatCellType[][];
}
export const CinemaRoomSchema = SchemaFactory.createForClass(CinemaRoom);

@Schema({ _id: false })
export class CinemaAnnouncement implements ICinemaAnnouncement {
  @Prop({ type: String, trim: true })
  title?: string;

  @Prop({ type: String, trim: true })
  body?: string;

  @Prop({ type: String, trim: true })
  imageUrl?: string;
}
export const CinemaAnnouncementSchema =
  SchemaFactory.createForClass(CinemaAnnouncement);

@Schema({ timestamps: true })
export class Cinema {
  _id!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  })
  ownerId!: Types.ObjectId;

  @Prop({ type: CinemaAddressSchema, required: true })
  address!: ICinemaAddress;

  @Prop({ type: CinemaLocationSchema })
  location?: ICinemaLocation;

  @Prop({ type: String, required: true, trim: true })
  phone!: string;

  @Prop({ type: String, required: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({ type: [String], default: [] })
  gallery?: string[];

  @Prop({ type: [CinemaRoomSchema], required: true, default: [] })
  rooms!: ICinemaRoom[];

  @Prop({ type: [CinemaAnnouncementSchema], default: [] })
  announcements?: ICinemaAnnouncement[];

  @Prop({ type: CinemaSocialsSchema, default: {} })
  socials?: ICinemaSocials;

  @Prop({ type: Boolean, default: false })
  allowPayInPerson!: boolean;

  @Prop({
    type: String,
    enum: [...CURRENCIES],
    default: "USD",
  })
  currency?: CurrencyCode;

  @Prop({
    type: String,
    enum: ["pending", "active", "rejected"],
    default: "pending",
    index: true,
  })
  status!: CinemaStatus;
}

export const CinemaSchema = SchemaFactory.createForClass(Cinema);
