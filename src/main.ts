import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as session from 'express-session';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import * as path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const options = new DocumentBuilder()
    .setTitle('WheelsOnDemand API Doc')
    .setDescription(
      `Welcome to the WheelsOnDemand API Documentation! This document provides detailed information on the available endpoints, request methods, parameters, and response formats for the WheelsOnDemand API.`,
    )
    .setVersion('1.0')
    .addServer('http://localhost:3000/', 'Local environment')
    .addTag('WheelsOnDemand')
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);

  app.useStaticAssets(path.join(__dirname, '../files'));
  app.useGlobalPipes(new ValidationPipe({ stopAtFirstError: true }));
  const configService = app.get(ConfigService);
  const port = configService.get('PORT');
  app.use(
    session({
      secret: process.env.SECRET_KEY,
      resave: false,
      saveUninitialized: false,
    }),
  );
  const corsOptions: CorsOptions = {
    origin: ['http://localhost:4200'],
    credentials: true,
  };
  app.enableCors(corsOptions);
  app.use(cookieParser());
  await app.listen(port);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
