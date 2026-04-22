import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:4200'],
    credentials: true,
  });
  app.setGlobalPrefix('api');
  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port);

  console.log(`QMS backend listening on :${port}`);
}
void bootstrap();
