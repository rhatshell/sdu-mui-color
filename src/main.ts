import { resolve } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useStaticAssets(resolve(__dirname, '../dist/ui'));
  await app.listen(process.env.PORT || 3001);
}
bootstrap();
