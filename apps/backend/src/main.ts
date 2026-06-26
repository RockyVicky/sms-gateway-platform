import '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // Get port from config
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Configure Swagger Document Builder
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SMS Gateway SaaS API')
    .setDescription(
      'Self-hosted transactional SMS and OTP delivery engine leveraging physical Android carrier gateways.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT token',
        in: 'header',
      },
      'bearer-token',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'Enter program client API key',
      },
      'api-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable CORS
  app.enableCors();

  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap();
