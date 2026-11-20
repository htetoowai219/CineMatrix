import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  Booking,
  BookingSchema,
} from "../bookings/schemas/booking.schema";
import { Cinema, CinemaSchema } from "../cinemas/schemas/cinema.schema";
import { Movie, MovieSchema } from "../movies/schemas/movie.schema";
import {
  ScreeningTemplate,
  ScreeningTemplateSchema,
} from "../templates/schemas/template.schema";
import { Screening, ScreeningSchema } from "./schemas/screening.schema";
import { ScreeningsController } from "./screenings.controller";
import { ScreeningsService } from "./screenings.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Screening.name, schema: ScreeningSchema },
      { name: Cinema.name, schema: CinemaSchema },
      { name: Movie.name, schema: MovieSchema },
      { name: ScreeningTemplate.name, schema: ScreeningTemplateSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
  ],
  controllers: [ScreeningsController],
  providers: [ScreeningsService],
  exports: [ScreeningsService],
})
export class ScreeningsModule {}
