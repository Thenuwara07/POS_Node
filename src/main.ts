// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser'; // <-- default import

function parseOrigins(csv?: string) {
  return csv ? csv.split(',').map(s => s.trim()).filter(Boolean) : [];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

    app.enableCors({
    origin: true, // Your Flutter web port
    credentials: true, // Required for cookies
    exposedHeaders: ['set-cookie'], // Needed for cookie access
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'origin'
    ]
  });


  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
