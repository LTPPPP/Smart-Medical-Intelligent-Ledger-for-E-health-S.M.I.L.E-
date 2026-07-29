import { Logger } from "@nestjs/common";
import { of, throwError } from "rxjs";
import { SwaggerAggregatorService } from "./swagger-aggregator.service";

describe("SwaggerAggregatorService logging privacy", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should not log raw upstream error text", async () => {
    const rawError = "sentinel-secret@example.test upstream failure";
    const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation();
    jest.spyOn(Logger.prototype, "log").mockImplementation();
    const httpService = {
      get: jest.fn().mockReturnValue(throwError(() => new Error(rawError))),
    };
    const configService = {
      get: jest.fn((key: string) => {
        if (key === "services.routes") {
          return [
            {
              name: "iam-service",
              target: "http://iam-service:3001",
            },
          ];
        }
        if (key === "services.gateway.proxyTimeout") return 30000;
        return undefined;
      }),
    };
    const service = new SwaggerAggregatorService(
      httpService as any,
      configService as any,
    );

    await service.refresh();

    expect(warn).toHaveBeenCalledWith(
      "operation=swagger_aggregation outcome=skipped service=iam-service reason=upstream_unavailable",
    );
    expect(JSON.stringify(warn.mock.calls)).not.toContain(rawError);
  });

  it("should not log an upstream URL when the spec is invalid", async () => {
    const sensitiveTarget =
      "http://private-user:private-password@iam-service:3001?token=sentinel";
    const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation();
    jest.spyOn(Logger.prototype, "log").mockImplementation();
    const httpService = {
      get: jest.fn().mockReturnValue(of({ data: {} })),
    };
    const configService = {
      get: jest.fn((key: string) => {
        if (key === "services.routes") {
          return [{ name: "iam-service", target: sensitiveTarget }];
        }
        if (key === "services.gateway.proxyTimeout") return 30000;
        return undefined;
      }),
    };
    const service = new SwaggerAggregatorService(
      httpService as any,
      configService as any,
    );

    await service.refresh();

    expect(warn).toHaveBeenCalledWith(
      "operation=swagger_aggregation outcome=skipped service=iam-service reason=invalid_spec",
    );
    expect(JSON.stringify(warn.mock.calls)).not.toContain(sensitiveTarget);
    expect(JSON.stringify(warn.mock.calls)).not.toContain("sentinel");
  });
});
