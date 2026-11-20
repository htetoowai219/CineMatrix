import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { multerSingle } from "../../common/interceptors/multer.interceptor";
import type { AuthUser } from "../../common/types/auth-user.type";
import { UserAuthService } from "./user-auth.service";

@Controller("user")
export class UserAuthController {
  constructor(private readonly service: UserAuthService) {}

  @Post("register")
  @UseInterceptors(multerSingle("profileImage"))
  register(@Body() body: any, @UploadedFile() file?: Express.Multer.File) {
    return this.service.register(body, file);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() body: any) {
    return this.service.login(body);
  }

  @Delete("logout")
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: AuthUser) {
    return this.service.logout(user.id);
  }

  @Patch("updateProfile")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(multerSingle("profileImage"))
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.updateProfile(user, body, file);
  }

  @Patch("updatePassword")
  @UseGuards(JwtAuthGuard)
  updatePassword(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.service.updatePassword(user, body);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: AuthUser) {
    return this.service.getProfile(user);
  }
}
