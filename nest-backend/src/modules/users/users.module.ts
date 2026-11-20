import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  Booking,
  BookingSchema,
} from "../bookings/schemas/booking.schema";
import { Cinema, CinemaSchema } from "../cinemas/schemas/cinema.schema";
import { Screening, ScreeningSchema } from "../screenings/schemas/screening.schema";
import {
  ScreeningTemplate,
  ScreeningTemplateSchema,
} from "../templates/schemas/template.schema";
import { User, UserSchema } from "./schemas/user.schema";
import { UserAuthController } from "./user-auth.controller";
import { UserAuthService } from "./user-auth.service";
import { UserManagementController } from "./user-management.controller";
import { UserManagementService } from "./user-management.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Cinema.name, schema: CinemaSchema },
      { name: ScreeningTemplate.name, schema: ScreeningTemplateSchema },
      { name: Screening.name, schema: ScreeningSchema },
      { name: Booking.name, schema: BookingSchema },
    ]),
  ],
  controllers: [UserAuthController, UserManagementController],
  providers: [UserAuthService, UserManagementService],
  exports: [UserAuthService, UserManagementService],
})
export class UsersModule {}
