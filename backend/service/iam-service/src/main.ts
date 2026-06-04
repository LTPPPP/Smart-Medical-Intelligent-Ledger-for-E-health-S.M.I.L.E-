import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('IAM');
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('IAM Service API')
    .setDescription('Identity and Access Management Service for S.M.I.L.E')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Health', 'Service health checks')
    .addTag('Auth', 'Authentication - login, register, refresh, forgot password')
    .addTag('Accounts', 'Account management')
    .addTag('UserProfiles', 'User profile management')
    .addTag('Roles', 'Role management and assignment')
    .addTag('Permissions', 'Permission management')
    .addTag('UserRoles', 'User-role assignment')
    .addTag('DigitalSignatures', 'Digital signature operations')
    .addTag('AuditLogs', 'Authentication audit logs')
    .addTag('Notifications', 'Notification management')
    .addTag('Notification Templates', 'Notification template management')
    .addTag('Notification Preferences', 'Notification preference management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'S.M.I.L.E — IAM Service API',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      tagsSorterAlpha: true,
    },
  });

  const port = process.env.APP_PORT || 3001;
  await app.listen(port);

  logger.log(`IAM Service is running on: http://localhost:${port}`);
  logger.log(`Swagger docs available at: http://localhost:${port}/docs`);
}

bootstrap();
