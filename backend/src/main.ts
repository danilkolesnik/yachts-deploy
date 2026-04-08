import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  app.useStaticAssets('/app/uploads', {
    prefix: '/uploads',
    setHeaders: (res) => {
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      res.set('Cache-Control', 'public, max-age=31536000');
    },
  });

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser tools / same-origin / SSR calls
      if (!origin) return callback(null, true);

      const allowed = new Set<string>([
        'http://46.225.17.97:3000',
        'http://localhost:3000',
        'https://g000l4c6-3000.euw.devtunnels.ms',
      ]);

      // Support env-configured client URL(s)
      const clientUrl = process.env.CLIENT_URL;
      if (clientUrl) allowed.add(clientUrl);

      // Dev: allow any localhost port (Next often bumps ports if busy)
      const isLocalhost =
        /^http:\/\/localhost:\d+$/i.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/i.test(origin);

      if (allowed.has(origin) || isLocalhost) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(5000);
}

bootstrap();