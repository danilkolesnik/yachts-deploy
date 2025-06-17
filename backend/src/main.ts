import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.enableCors({
    origin: ['http://localhost:3000', 'https://g000l4c6-3000.euw.devtunnels.ms', 'http://116.203.198.150:3000'],
  });

  await app.listen(5000);
}

bootstrap();