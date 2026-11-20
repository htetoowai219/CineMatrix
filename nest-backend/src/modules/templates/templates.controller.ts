import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthUser } from "../../common/types/auth-user.type";
import { TemplatesService } from "./templates.service";

@Controller("template")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("cinema_owner", "cinema_staff")
export class TemplatesController {
  constructor(private readonly service: TemplatesService) {}

  @Get()
  getTemplates(@CurrentUser() user: AuthUser) {
    return this.service.getTemplates(user);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.service.create(user, body);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.service.update(user, id, body);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.service.remove(user, id);
  }
}
