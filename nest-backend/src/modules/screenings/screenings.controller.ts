import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthUser } from "../../common/types/auth-user.type";
import { ScreeningsService } from "./screenings.service";

@Controller("screening")
export class ScreeningsController {
  constructor(private readonly service: ScreeningsService) {}

  // Public routes are declared before @Get(':id') in the original router too.
  @Get("public")
  getPublicScreenings(@Query() query: Record<string, any>) {
    return this.service.getPublicScreenings(query);
  }

  @Get("public/:id")
  getPublicScreeningById(@Param("id") id: string) {
    return this.service.getPublicScreeningById(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("cinema_owner", "cinema_staff")
  getScreenings(@CurrentUser() user: AuthUser) {
    return this.service.getScreenings(user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("cinema_owner", "cinema_staff")
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.service.create(user, body);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("cinema_owner", "cinema_staff")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.service.update(user, id, body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("cinema_owner", "cinema_staff")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.service.remove(user, id);
  }
}
