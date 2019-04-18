import * as os from 'os';
import { resolve } from 'path';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: new Logger() });
  app.use((req, res, next) => {
    const url = req.protocol + '://' + req.get('host') + req.originalUrl;
    Logger.log(`Host: ${os.hostname}, Url: ${url}`);

    next();
  });
  app.useStaticAssets(resolve(__dirname, '../dist/ui'));
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
