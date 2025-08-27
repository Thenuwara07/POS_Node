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
    origin: false, // Your Flutter web port
    credentials: true, // Required for cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'origin'
    ]
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
