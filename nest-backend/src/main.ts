import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const frontendClient = process.env.FRONTEND_CLIENT;
  const frontendAdmin = process.env.FRONTEND_ADMIN;
  if (!frontendClient) {
    throw new Error("FRONTEND_CLIENT environment variable is missing");
  }
  if (!frontendAdmin) {
    throw new Error("FRONTEND_ADMIN environment variable is missing");
  }

  // Same two-origin, credentialed CORS policy as the Express server.
  app.enableCors({
    origin: [frontendClient, frontendAdmin],
    credentials: true,
  });

  // No global prefix: existing clients call /user, /movie, /cinema, etc.
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server running on ${port}`);
}

void bootstrap();
