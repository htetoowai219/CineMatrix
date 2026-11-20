import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../../common/guards/optional-jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { uploadCinemaImagesInterceptor } from "../../common/interceptors/multer.interceptor";
import type { AuthUser } from "../../common/types/auth-user.type";
import { CinemasService } from "./cinemas.service";

type CinemaUploadFiles = {
  images?: Express.Multer.File[];
  gallery?: Express.Multer.File[];
};

@Controller("cinema")
export class CinemasController {
  constructor(private readonly service: CinemasService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  getAllCinemas(
    @CurrentUser() user: AuthUser | undefined,
    @Query() query: Record<string, any>,
  ) {
    return this.service.getAllCinemas(user, query);
  }

  @Get("my")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "cinema_owner", "cinema_staff")
  getMyCinemas(@CurrentUser() user: AuthUser) {
    return this.service.getMyCinemas(user);
  }

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  getCinemaById(
    @CurrentUser() user: AuthUser | undefined,
    @Param("id") id: string,
  ) {
    return this.service.getCinemaById(user, id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("cinema_owner")
  @UseInterceptors(uploadCinemaImagesInterceptor)
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: any,
    @UploadedFiles() files?: CinemaUploadFiles,
  ) {
    return this.service.create(user, body, files);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "cinema_owner", "cinema_staff")
  @UseInterceptors(uploadCinemaImagesInterceptor)
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: any,
    @UploadedFiles() files?: CinemaUploadFiles,
  ) {
    return this.service.update(user, id, body, files);
  }

  @Patch(":id/approve")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  approve(@Param("id") id: string) {
    return this.service.approve(id);
  }

  @Patch(":id/reject")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  reject(@Param("id") id: string) {
    return this.service.reject(id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "cinema_owner")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.service.remove(user, id);
  }
}
