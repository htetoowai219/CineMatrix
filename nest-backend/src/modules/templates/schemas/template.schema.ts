import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";

export type ScreeningTemplateDocument = HydratedDocument<ScreeningTemplate>;

@Schema({ timestamps: true })
export class ScreeningTemplate {
  _id!: Types.ObjectId;

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

  @Prop({ type: Map, of: Number, required: true })
  rowPrices!: Map<string, number>;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "User",
    required: true,
  })
  createdBy!: Types.ObjectId;
}

export const ScreeningTemplateSchema =
  SchemaFactory.createForClass(ScreeningTemplate);
