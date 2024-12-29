import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const API_PREFIX = "api";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(API_PREFIX);
  configureSwagger(app);
  await app.listen(3000);
}

function configureSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('My API')
    .setDescription('API Documentation for My Application')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);
}

bootstrap();
