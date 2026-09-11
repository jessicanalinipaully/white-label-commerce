import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable graceful shutdown hooks for SIGTERM / SIGINT
  app.enableShutdownHooks();

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configure CORS dynamically from environment
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
    : [process.env.WEB_URL || 'http://localhost:3000', 'http://localhost:3000'];

  app.enableCors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
  });

  const port = process.env.API_PORT || process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Application is running on port ${port} at /api`);
}

bootstrap();
