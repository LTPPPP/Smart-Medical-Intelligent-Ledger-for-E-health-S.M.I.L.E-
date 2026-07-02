import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe, VersioningType } from "@nestjs/common";
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerCustomOptions,
} from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { GatewayExceptionFilter } from "./common/filters/gateway-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { SwaggerAggregatorService } from "./swagger/swagger-aggregator.service";

async function bootstrap() {
  const logger = new Logger("Gateway");

  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug", "verbose"],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>("services.gateway.port") || 3000;
  const corsOrigin =
    configService.get<string>("services.gateway.corsOrigin") || "*";

  // ── CORS ────────────────────────────────────────────────────────────────
  app.enableCors({
    origin:
      corsOrigin === "*" ? "*" : corsOrigin.split(",").map((o) => o.trim()),
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "content-type",
      "Authorization",
      "authorization",
      "X-Requested-With",
      "x-requested-with",
      "Accept",
      "accept",
    ],
    exposedHeaders: ["X-Total-Count", "X-Page-Count"],
    maxAge: 3600,
  });

  // ── Global Validation Pipe ──────────────────────────────────────────────
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

  // ── Global Filters & Interceptors ───────────────────────────────────────
  app.useGlobalFilters(new GatewayExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ── Graceful Shutdown ───────────────────────────────────────────────────
  app.enableShutdownHooks();

  // ── URI Versioning ──────────────────────────────────────────────────────
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // ── Swagger / OpenAPI ───────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle("S.M.I.L.E API Gateway")
    .setDescription(
      "Unified API Gateway for S.M.I.L.E dental clinic platform.\n\n" +
        "This gateway aggregates OpenAPI specs from all downstream microservices " +
        "into a single unified documentation.\n\n" +
        "**Downstream Services:**\n" +
        "- IAM Service (port 3001)\n" +
        "- Clinical/EMR Service (port 8082)\n" +
        "- Payment Service (port 3006)\n\n" +
        "Use `GET /swagger/refresh` to re-aggregate specs after downstream changes.",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("[Gateway] Health", "Gateway and downstream service health checks")
    .build();

  // Create the base gateway document (just health endpoints)
  const gatewayDocument = SwaggerModule.createDocument(app, swaggerConfig, {
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `Gateway_${controllerKey}_${methodKey}`,
  });

  // Swagger UI custom options — consistent with all other services
  // Point swagger-ui to our dynamic merged spec endpoint
  const swaggerOptions: SwaggerCustomOptions = {
    customSiteTitle: "S.M.I.L.E \u2014 API Gateway",
    useGlobalPrefix: false,
    swaggerOptions: {
      url: "/gateway-spec-json",
      persistAuthorization: true,
      docExpansion: "list",
      filter: true,
      tagsSorterAlpha: true,
    },
  };

  SwaggerModule.setup("docs", app, gatewayDocument, swaggerOptions);

  // ── Dynamic spec endpoint: merges gateway + aggregated downstream specs ─
  const aggregator = app.get(SwaggerAggregatorService);
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.get("/gateway-spec-json", (_req: any, res: any) => {
    const aggregated = aggregator.getAggregatedSpec();
    if (!aggregated) {
      return res.json(gatewayDocument);
    }

    const merged = {
      ...gatewayDocument,
      paths: {
        ...gatewayDocument.paths,
        ...(aggregated.paths || {}),
      },
      components: {
        ...gatewayDocument.components,
        schemas: {
          ...(gatewayDocument.components?.schemas || {}),
          ...(aggregated.components?.schemas || {}),
        },
      },
      tags: [...(gatewayDocument.tags || []), ...(aggregated.tags || [])],
    };

    return res.json(merged);
  });

  // ── Start Listening ─────────────────────────────────────────────────────
  await app.listen(port);

  logger.log(`S.M.I.L.E API Gateway is running on: http://localhost:${port}`);
  logger.log(`Swagger docs available at: http://localhost:${port}/docs`);
  logger.log(`Health check at: http://localhost:${port}/health`);
}

bootstrap().catch((err) => {
  const logger = new Logger("Gateway");
  logger.error(`Failed to start gateway: ${err.message}`, err.stack);
  process.exit(1);
});
