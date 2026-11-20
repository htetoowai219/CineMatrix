import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";
import type {
  BookingPaymentMethod,
  BookingStatus,
  IBookingSeat,
} from "../../../common/types/booking.type";

export type BookingDocument = HydratedDocument<Booking>;

@Schema({ _id: false })
export class BookingSeat implements IBookingSeat {
  @Prop({ type: String, required: true, trim: true })
  label!: string;

  @Prop({ type: String, required: true, trim: true })
  row!: string;

  @Prop({ type: Boolean, required: true, default: false })
  isDouble!: boolean;

  @Prop({ type: Number, required: true, min: 0 })
  price!: number;
}
export const BookingSeatSchema = SchemaFactory.createForClass(BookingSeat);

@Schema({ timestamps: true })
export class Booking {
  _id!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "Screening",
    required: true,
    index: true,
  })
  screeningId!: Types.ObjectId;

  @Prop({ type: [BookingSeatSchema], required: true })
  seats!: IBookingSeat[];

  @Prop({ type: Number, required: true, min: 0 })
  totalPrice!: number;

  @Prop({
    type: String,
    enum: ["screenshot", "in_person"],
    required: true,
  })
  paymentMethod!: BookingPaymentMethod;

  @Prop({ type: String, trim: true })
  paymentScreenshotUrl?: string;

  @Prop({
    type: String,
    enum: ["pending", "confirmed", "rejected", "cancelled"],
    default: "pending",
    index: true,
  })
  status!: BookingStatus;

  @Prop({ type: String, trim: true })
  notes?: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);
BookingSchema.index({ screeningId: 1, status: 1 });
