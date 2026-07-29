import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { ServiceRoute } from "../config/services.config";

/**
 * Tag prefix mapping — maps downstream service names to display prefixes
 * for the aggregated gateway Swagger UI.
 */
const SERVICE_PREFIX_MAP: Record<string, string> = {
  "iam-service": "IAM",
  "clinical-emr-service": "Clinical",
  "payment-service": "Payment",
};

interface OpenApiSpec {
  openapi?: string;
  paths?: Record<string, any>;
  components?: { schemas?: Record<string, any> };
  tags?: Array<{ name: string; description?: string }>;
}

@Injectable()
export class SwaggerAggregatorService implements OnModuleInit {
  private readonly logger = new Logger(SwaggerAggregatorService.name);
  private aggregatedSpec: OpenApiSpec | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Delay spec aggregation to allow downstream services to start
    const delay = parseInt(process.env.SWAGGER_AGGREGATE_DELAY || "5000", 10);
    setTimeout(() => this.aggregateSpecs(), delay);
  }

  /**
   * Returns the aggregated OpenAPI spec merged from all downstream services.
   * Returns null if aggregation hasn't completed yet.
   */
  getAggregatedSpec(): OpenApiSpec | null {
    return this.aggregatedSpec;
  }

  /**
   * Force re-aggregation (e.g. via a refresh endpoint).
   */
  async refresh(): Promise<OpenApiSpec | null> {
    return this.aggregateSpecs();
  }

  private async aggregateSpecs(): Promise<OpenApiSpec | null> {
    const routes =
      this.configService.get<ServiceRoute[]>("services.routes") || [];
    const timeout =
      this.configService.get<number>("services.gateway.proxyTimeout") || 30000;

    // Deduplicate services (some have multiple route groups)
    const serviceMap = new Map<string, string>();
    for (const route of routes) {
      if (!serviceMap.has(route.name)) {
        serviceMap.set(route.name, route.target);
      }
    }

    const mergedPaths: Record<string, any> = {};
    const mergedSchemas: Record<string, any> = {};
    const mergedTags: Array<{ name: string; description?: string }> = [];
    const seenTags = new Set<string>();

    for (const [serviceName, target] of serviceMap) {
      const prefix = SERVICE_PREFIX_MAP[serviceName] || serviceName;
      const specUrl = `${target}/docs-json`;

      try {
        const response = await firstValueFrom(
          this.httpService.get<OpenApiSpec>(specUrl, { timeout }),
        );
        const spec = response.data;

        if (!spec || !spec.paths) {
          this.logger.warn(
            `operation=swagger_aggregation outcome=skipped service=${serviceName} reason=invalid_spec`,
          );
          continue;
        }

        // Merge tags with service prefix (skip 'Health' — gateway has its own)
        const tagRenameMap = new Map<string, string>();
        const skipTags = new Set(["Health", "Home"]);
        for (const tag of spec.tags || []) {
          if (skipTags.has(tag.name)) continue;
          const prefixedName = `[${prefix}] ${tag.name}`;
          tagRenameMap.set(tag.name, prefixedName);

          if (!seenTags.has(prefixedName)) {
            seenTags.add(prefixedName);
            mergedTags.push({
              name: prefixedName,
              description: tag.description || "",
            });
          }
        }

        // Find the pathRewrite config for this service to map gateway paths
        const serviceRoutes = routes.filter((r) => r.name === serviceName);

        // Merge paths — rewrite to gateway-facing paths
        for (const [path, methods] of Object.entries(spec.paths)) {
          // Skip health/home paths — gateway has its own health check
          if (
            path.match(/\/(health|home)(\/|$)/i) ||
            path === "/" ||
            path === ""
          ) {
            continue;
          }

          const gatewayPath = this.resolveGatewayPath(
            path,
            serviceName,
            serviceRoutes,
          );

          // Rename tags in each operation
          const retaggedMethods: Record<string, any> = {};
          let hasValidTag = false;
          for (const [method, operation] of Object.entries(methods as any)) {
            const op = { ...(operation as any) };
            if (op.tags) {
              op.tags = op.tags
                .filter((t: string) => !skipTags.has(t))
                .map((t: string) => tagRenameMap.get(t) || `[${prefix}] ${t}`);
              if (op.tags.length > 0) hasValidTag = true;
            }
            // Prefix operationId to avoid collisions
            if (op.operationId) {
              op.operationId = `${prefix}_${op.operationId}`;
            }
            retaggedMethods[method] = op;
          }

          if (hasValidTag) {
            mergedPaths[gatewayPath] = retaggedMethods;
          }
        }

        // Merge schemas with service prefix
        if (spec.components?.schemas) {
          for (const [schemaName, schema] of Object.entries(
            spec.components.schemas,
          )) {
            const prefixedSchema = `${prefix}_${schemaName}`;
            // Deep-rewrite $ref pointers
            mergedSchemas[prefixedSchema] = this.rewriteRefs(schema, prefix);
          }
        }

        this.logger.log(
          `Aggregated ${Object.keys(spec.paths).length} paths from ${serviceName}`,
        );
      } catch {
        this.logger.warn(
          `operation=swagger_aggregation outcome=skipped service=${serviceName} reason=upstream_unavailable`,
        );
      }
    }

    this.aggregatedSpec = {
      paths: mergedPaths,
      components: { schemas: mergedSchemas },
      tags: mergedTags,
    };

    this.logger.log(
      `Swagger aggregation complete: ${Object.keys(mergedPaths).length} paths, ${mergedTags.length} tags`,
    );

    return this.aggregatedSpec;
  }

  /**
   * Resolves external (gateway-facing) path for a downstream service path.
   *
   * Strategy: reverse the pathRewrite to find the gateway prefix. For example:
   *   downstream path: /v1/auth/login
   *   pathRewrite: { "^/api/v1/auth": "/v1/auth" }
   *   → gateway path: /api/v1/auth/login
   */
  private resolveGatewayPath(
    downstreamPath: string,
    serviceName: string,
    serviceRoutes: ServiceRoute[],
  ): string {
    for (const route of serviceRoutes) {
      // Check each pathRewrite rule (reverse direction)
      for (const [gatewayPattern, targetReplace] of Object.entries(
        route.pathRewrite,
      )) {
        // Remove regex anchors for comparison
        const cleanTarget = targetReplace.replace(/^\^/, "");
        if (downstreamPath.startsWith(cleanTarget)) {
          // Reverse: replace targetReplace prefix with gateway prefix
          const cleanGateway = gatewayPattern.replace(/^\^/, "");
          return downstreamPath.replace(cleanTarget, cleanGateway);
        }
      }

      // If no pathRewrite or empty pathRewrite, check prefix match
      if (Object.keys(route.pathRewrite).length === 0) {
        for (const prefix of route.prefixes) {
          // downstream path might already match the gateway prefix (no rewrite)
          if (downstreamPath.startsWith(prefix.replace("/api/v1", "/api/v1"))) {
            return downstreamPath;
          }
        }
      }
    }

    // Fallback: keep the original path with /api prefix
    if (downstreamPath.startsWith("/v1/")) {
      return `/api${downstreamPath}`;
    }
    if (downstreamPath.startsWith("/api/v1/")) {
      return downstreamPath;
    }
    return `/api/v1${downstreamPath}`;
  }

  /**
   * Recursively rewrite $ref pointers in schemas to include service prefix.
   */
  private rewriteRefs(obj: any, prefix: string): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === "string") return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.rewriteRefs(item, prefix));
    }

    if (typeof obj === "object") {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key === "$ref" && typeof value === "string") {
          // Rewrite: #/components/schemas/Foo → #/components/schemas/Prefix_Foo
          result[key] = value.replace(
            "#/components/schemas/",
            `#/components/schemas/${prefix}_`,
          );
        } else {
          result[key] = this.rewriteRefs(value, prefix);
        }
      }
      return result;
    }

    return obj;
  }
}
