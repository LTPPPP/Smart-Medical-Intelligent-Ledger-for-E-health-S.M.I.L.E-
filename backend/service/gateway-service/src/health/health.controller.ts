import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheckResult,
} from "@nestjs/terminus";
import { ConfigService } from "@nestjs/config";
import { ServiceRoute } from "../config/services.config";

@ApiTags("[Gateway] Health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: "Aggregated health check for all downstream services",
  })
  async check(): Promise<HealthCheckResult> {
    const routes =
      this.configService.get<ServiceRoute[]>("services.routes") || [];
    const timeout =
      this.configService.get<number>("services.gateway.proxyTimeout") || 30000;

    const seen = new Set<string>();
    const indicators = routes
      .filter((route) => {
        if (seen.has(route.name)) return false;
        seen.add(route.name);
        return true;
      })
      .map(
        (route) => () =>
          this.http.pingCheck(
            route.name,
            `${route.target}${route.healthPath}`,
            {
              timeout,
            },
          ),
      );

    return this.health.check(indicators);
  }

  @Get("live")
  @ApiOperation({ summary: "Gateway liveness probe" })
  liveness() {
    return { status: "ok", timestamp: new Date().toISOString() };
  }

  @Get("ready")
  @HealthCheck()
  @ApiOperation({
    summary:
      "Gateway readiness probe (checks IAM/auth dependency via iam-service or auth-service)",
  })
  async readiness(): Promise<HealthCheckResult> {
    const routes =
      this.configService.get<ServiceRoute[]>("services.routes") || [];
    const iamRoute = routes.find((r) => r.name === "iam-service");
    const authRoute = routes.find((r) => r.name === "auth-service");
    const readinessRoute = iamRoute || authRoute;
    const readinessUrl = readinessRoute?.target;
    const readinessName = readinessRoute?.name || "auth-service";
    const readinessPath = readinessRoute?.healthPath || "/docs";

    return this.health.check([
      ...(readinessUrl
        ? [
            () =>
              this.http.pingCheck(
                readinessName,
                `${readinessUrl}${readinessPath}`,
              ),
          ]
        : []),
    ]);
  }
}
