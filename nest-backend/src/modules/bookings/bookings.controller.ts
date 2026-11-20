import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { multerSingle } from "../../common/interceptors/multer.interceptor";
import type { AuthUser } from "../../common/types/auth-user.type";
import { BookingsService } from "./bookings.service";

@Controller("booking")
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  @Post("upload")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("customer")
  @UseInterceptors(multerSingle("paymentScreenshot"))
  uploadPaymentScreenshot(@UploadedFile() file?: Express.Multer.File) {
    return this.service.uploadPaymentScreenshot(file);
  }

  @Post("lock")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("customer")
  lockSeats(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.service.lockSeats(user, body);
  }

  @Post("unlock")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("customer")
  unlockSeats(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.service.unlockSeats(user, body);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("customer")
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.service.createBooking(user, body);
  }

  @Get("my")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("customer")
  getMyBookings(@CurrentUser() user: AuthUser) {
    return this.service.getMyBookings(user);
  }

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("customer")
  cancelBooking(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.service.cancelBooking(user, id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("cinema_owner", "cinema_staff")
  getBookings(@CurrentUser() user: AuthUser, @Query() query: Record<string, any>) {
    return this.service.getBookings(user, query);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("cinema_owner", "cinema_staff")
  updateBookingStatus(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.service.updateBookingStatus(user, id, body);
  }
}
