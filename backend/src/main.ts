import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000','https://g000l4c6-3000.euw.devtunnels.ms'],
  });
  await app.listen(3000);
}

bootstrap();
