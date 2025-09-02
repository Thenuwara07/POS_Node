// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

function parseOrigins(csv?: string) {
  return csv ? csv.split(',').map(s => s.trim()).filter(Boolean) : [];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);



app.enableCors({
  origin: (origin, callback) => {
    // Allow Postman & mobile apps (no origin header)
    if (!origin) return callback(null, true);

    // Allow localhost dev (any port) and LAN IPs
    const ok =
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin);

    if (ok) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  credentials: false, // keep false since you’re returning JWTs in JSON (not cookies)
});



   // 🔥 Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Auth API')
    .setDescription('NestJS Authentication API (JWT-based)')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth', // key name
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  if (await app.listen(process.env.PORT ?? 3001)) {
    console.log(`Server is running on port ${process.env.PORT ?? 3001}`);
  } else {
    console.error('Failed to start server');
  }

}
bootstrap();
