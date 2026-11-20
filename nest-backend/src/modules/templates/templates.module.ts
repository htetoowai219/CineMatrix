import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Cinema, CinemaSchema } from "../cinemas/schemas/cinema.schema";
import { Movie, MovieSchema } from "../movies/schemas/movie.schema";
import {
  ScreeningTemplate,
  ScreeningTemplateSchema,
} from "./schemas/template.schema";
import { TemplatesController } from "./templates.controller";
import { TemplatesService } from "./templates.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ScreeningTemplate.name, schema: ScreeningTemplateSchema },
      { name: Cinema.name, schema: CinemaSchema },
      { name: Movie.name, schema: MovieSchema },
    ]),
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
