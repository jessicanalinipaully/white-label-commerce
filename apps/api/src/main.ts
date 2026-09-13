import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Startup production environment validation
  if (process.env.NODE_ENV === 'production') {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'super-secret-jwt-key-change-in-production') {
      logger.error('CRITICAL: JWT_SECRET must be configured with a secure production key in .env.production!');
      process.exit(1);
    }
    if (!process.env.DATABASE_URL) {
      logger.error('CRITICAL: DATABASE_URL is missing in production environment!');
      process.exit(1);
    }
  }

  const app = await NestFactory.create(AppModule);

  // Configure Express to trust Nginx reverse proxy
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // Serve local uploaded product images
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  expressApp.use('/uploads', (req: any, res: any, next: () => void) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  }, express.static(uploadsDir));
  expressApp.use('/api/uploads', (req: any, res: any, next: () => void) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
  }, express.static(uploadsDir));

  // Body parser size limit
  app.use(express.json({ limit: '1mb' }));

  // Security Headers Middleware
  app.use((req: any, res: any, next: () => void) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // Enable graceful shutdown hooks for SIGTERM / SIGINT
  app.enableShutdownHooks();

  // Register Global Exception Filter for error redaction
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Configure CORS dynamically to support multi-tenant subdomains (e.g. urbanthread.localhost:3000, aurelia.localhost:3000)
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const configuredOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
        : [];

      if (
        origin === 'http://localhost:3000' ||
        origin.endsWith('.localhost:3000') ||
        configuredOrigins.includes(origin) ||
        configuredOrigins.includes('*')
      ) {
        return callback(null, true);
      }

      callback(null, false);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Forwarded-Host', 'X-Requested-With'],
  });

  const port = process.env.API_PORT || process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Application is running on port ${port} at /api`);
}

bootstrap();
