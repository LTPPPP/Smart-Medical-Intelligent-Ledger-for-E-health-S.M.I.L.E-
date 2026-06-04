import 'dotenv/config';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';
import validationOptions from './utils/validation-options';
import { AllConfigType } from './config/config.type';
import { ResolvePromisesInterceptor } from './utils/serializer.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(
    // ResolvePromisesInterceptor is used to resolve promises in responses because class-transformer can't do it
    // https://github.com/typestack/class-transformer/issues/549
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  const options = new DocumentBuilder()
    .setTitle('Clinical/EMR Service API')
    .setDescription(
      'Consolidated clinical and medical domain service for S.M.I.L.E',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Health', 'Service health checks')
    .addTag('Patients', 'Patient registration and management')
    .addTag('Medical Records', 'Patient medical records, history and exports')
    .addTag(
      'Examinations',
      'Examination sessions, clinical orders and symptoms',
    )
    .addTag('Appointments', 'Appointment scheduling and management')
    .addTag('Treatments', 'Treatment plans and history')
    .addTag('Prescriptions', 'Prescription and prescription items management')
    .addTag('Diagnoses', 'Diagnosis records')
    .addTag('Dental Charts', 'Dental charting and imaging')
    .addTag('Dental Images', 'Dental image upload, annotation and PACS sync')
    .addTag('Clinics', 'Clinic management')
    .addTag('Doctors', 'Doctor schedules, specialties, and leaves')
    .addTag('Services', 'Service categories and service items')
    .addTag('Lab Results', 'Lab test results')
    .addTag('Treatment Rooms', 'Treatment room management')
    .addTag('Work Shifts', 'Work shift management')
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: process.env.APP_HEADER_LANGUAGE || 'x-custom-lang',
      schema: {
        example: 'en',
      },
    })
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'S.M.I.L.E — Clinical/EMR Service API',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      tagsSorterAlpha: true,
    },
  });

  await app.listen(configService.getOrThrow('app.port', { infer: true }));
}
void bootstrap();
