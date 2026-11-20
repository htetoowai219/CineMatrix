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
import { RolesGuard } from "../../common/guards/roles.guard";
import { uploadMovieImagesInterceptor } from "../../common/interceptors/multer.interceptor";
import type { AuthUser } from "../../common/types/auth-user.type";
import { MoviesService } from "./movies.service";

type MovieUploadFiles = {
  posterImage?: Express.Multer.File[];
  backdropImage?: Express.Multer.File[];
};

@Controller("movie")
export class MoviesController {
  constructor(private readonly service: MoviesService) {}

  @Get()
  getAllMovies(@Query() query: Record<string, any>) {
    return this.service.getAllMovies(query);
  }

  // Declared before @Get(':id') so /movie/tmdb/search is not swallowed by it.
  @Get("tmdb/search")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  tmdbSearch(
    @CurrentUser() user: AuthUser,
    @Query() query: Record<string, any>,
  ) {
    return this.service.tmdbSearch(user, query);
  }

  @Post("tmdb/import")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  tmdbImport(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.service.tmdbImport(user, body);
  }

  @Get(":id")
  getMovieById(@Param("id") id: string) {
    return this.service.getMovieById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @UseInterceptors(uploadMovieImagesInterceptor)
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: any,
    @UploadedFiles() files?: MovieUploadFiles,
  ) {
    return this.service.create(user, body, files);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @UseInterceptors(uploadMovieImagesInterceptor)
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() body: any,
    @UploadedFiles() files?: MovieUploadFiles,
  ) {
    return this.service.update(user, id, body, files);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.service.remove(user, id);
  }
}
