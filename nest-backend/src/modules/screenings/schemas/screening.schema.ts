import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";
import type {
  IScreeningSeat,
  ScreeningSeatStatus,
} from "../../../common/types/screening.type";

export type ScreeningDocument = HydratedDocument<Screening>;

@Schema({ _id: false })
export class ScreeningSeat implements IScreeningSeat {
  @Prop({ type: String, required: true, trim: true })
  label!: string;

  @Prop({ type: String, required: true, trim: true })
  row!: string;

  @Prop({ type: Boolean, required: true, default: false })
  isDouble!: boolean;

  @Prop({ type: Number, required: true, min: 0 })
  price!: number;

  @Prop({
    type: String,
    enum: ["available", "held", "booked"],
    default: "available",
  })
  status!: ScreeningSeatStatus;
}
export const ScreeningSeatSchema = SchemaFactory.createForClass(ScreeningSeat);

@Schema({ timestamps: true })
export class Screening {
  _id!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "ScreeningTemplate",
    required: true,
    index: true,
  })
  templateId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "Cinema",
    required: true,
    index: true,
  })
  cinemaId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "Movie",
    required: true,
    index: true,
  })
  movieId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  roomName!: string;

  @Prop({ type: Date, required: true, index: true })
  startTime!: Date;

  @Prop({ type: Date, required: true })
  endTime!: Date;

  @Prop({ type: [ScreeningSeatSchema], required: true })
  seats!: IScreeningSeat[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "User",
    required: true,
  })
  createdBy!: Types.ObjectId;
}

export const ScreeningSchema = SchemaFactory.createForClass(Screening);
ScreeningSchema.index({ cinemaId: 1, startTime: 1 });
