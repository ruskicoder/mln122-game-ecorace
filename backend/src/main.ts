import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Log DATABASE_URL (password masked) for startup diagnostics
  const rawUrl = process.env.DATABASE_URL;
  const maskedUrl = rawUrl
    ? rawUrl.replace(/\/\/[^:]+:([^@]+)@/, '//***:***@')
    : '(not set)';
  console.log(`[bootstrap] DATABASE_URL: ${maskedUrl}`);

  // Configure global API prefix
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
