import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Cinema, CinemaSchema } from "../cinemas/schemas/cinema.schema";
import { Movie, MovieSchema } from "../movies/schemas/movie.schema";
import { Screening, ScreeningSchema } from "../screenings/schemas/screening.schema";
import { User, UserSchema } from "../users/schemas/user.schema";
import { Booking, BookingSchema } from "./schemas/booking.schema";
import { BookingsController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";
import { SeatLockReconcilerService } from "./seat-lock-reconciler.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Screening.name, schema: ScreeningSchema },
      { name: Cinema.name, schema: CinemaSchema },
      { name: Movie.name, schema: MovieSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService, SeatLockReconcilerService],
  exports: [BookingsService],
})
export class BookingsModule {}
