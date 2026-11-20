import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { CinemasModule } from "./modules/cinemas/cinemas.module";
import { CloudinaryModule } from "./modules/cloudinary/cloudinary.module";
import { MailerModule } from "./modules/mailer/mailer.module";
import { MoviesModule } from "./modules/movies/movies.module";
import { RedisModule } from "./modules/redis/redis.module";
import { ScreeningsModule } from "./modules/screenings/screenings.module";
import { TemplatesModule } from "./modules/templates/templates.module";
import { TmdbModule } from "./modules/tmdb/tmdb.module";
import { UsersModule } from "./modules/users/users.module";

const MAX_ATTEMPTS = 10;
const RETRY_DELAY_MS = 3_000;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>("MONGO_URI");

        if (!uri) {
          throw new Error("MONGO_URI missing.");
        }

        return {
          uri,
          serverSelectionTimeoutMS: 5_000,
          // Same retry policy as the Express backend's connectDb().
          retryAttempts: MAX_ATTEMPTS,
          retryDelay: RETRY_DELAY_MS,
          connectionFactory: (connection: Connection) => {
            console.log("Connected to Db : " + connection.host);
            return connection;
          },
        };
      },
    }),
    CloudinaryModule,
    MailerModule,
    RedisModule,
    TmdbModule,
    UsersModule,
    MoviesModule,
    CinemasModule,
    TemplatesModule,
    ScreeningsModule,
    BookingsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
