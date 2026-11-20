import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthUser } from "../../common/types/auth-user.type";
import { UserManagementService } from "./user-management.service";

@Controller("user")
export class UserManagementController {
  constructor(private readonly service: UserManagementService) {}

  @Get("owners")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  getOwners() {
    return this.service.getOwners();
  }

  @Post("owners")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  createOwner(@Body() body: any) {
    return this.service.createOwner(body);
  }

  @Delete("owners/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  deleteOwner(
    @Param("id") id: string,
    @Body() body: any,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.deleteOwner(id, body, user);
  }

  @Get("staff")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("cinema_owner")
  getStaff(@CurrentUser() user: AuthUser) {
    return this.service.getStaff(user);
  }

  @Post("staff")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("cinema_owner")
  createStaff(@Body() body: any, @CurrentUser() user: AuthUser) {
    return this.service.createStaff(body, user);
  }

  @Delete("staff/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("cinema_owner")
  deleteStaff(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.service.deleteStaff(id, user);
  }
}
