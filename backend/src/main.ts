import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  const uploadsRoot =
    process.env.UPLOADS_DIR ||
    (existsSync('/app/uploads') ? '/app/uploads' : join(__dirname, '..', 'uploads'));

  app.useStaticAssets(uploadsRoot, {
    prefix: '/uploads',
    setHeaders: (res) => {
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      res.set('Cache-Control', 'public, max-age=31536000');
    },
  });

  const normalizeOrigin = (value: string) => value.trim().replace(/\/$/, '');

  const allowedOrigins = new Set<string>(
    [
      'http://46.225.17.97:3000',
      'http://localhost:3000',
      'https://g000l4c6-3000.euw.devtunnels.ms',
      process.env.CLIENT_URL,
      // Comma-separated list, e.g. https://staging.a-s-m.yachts,https://live.a-s-m.yachts
      ...(process.env.CLIENT_URLS || '').split(','),
    ]
      .filter(Boolean)
      .map((value) => normalizeOrigin(String(value))),
  );

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser tools / same-origin / SSR calls
      if (!origin) return callback(null, true);

      const normalized = normalizeOrigin(origin);

      // Dev: allow any localhost port (Next often bumps ports if busy)
      const isLocalhost =
        /^http:\/\/localhost:\d+$/i.test(normalized) ||
        /^http:\/\/127\.0\.0\.1:\d+$/i.test(normalized);

      if (allowedOrigins.has(normalized) || isLocalhost) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(5000);
}

bootstrap();