import { Global, Module } from "@nestjs/common";
import { TmdbService } from "./tmdb.service";

@Global()
@Module({
  providers: [TmdbService],
  exports: [TmdbService],
})
export class TmdbModule {}
