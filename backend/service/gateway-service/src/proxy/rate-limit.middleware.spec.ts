import { Logger } from "@nestjs/common";
import { RateLimitMiddleware } from "./rate-limit.middleware";

describe("RateLimitMiddleware logging privacy", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should not log Redis error text or request identity", async () => {
    const rawError = "sentinel-patient@example.test could not connect";
    const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation();
    const redis = {
      incr: jest.fn().mockRejectedValue(new Error(rawError)),
      expire: jest.fn(),
    };
    const config = {
      get: jest.fn((key: string) => {
        if (key === "services.rateLimit.enabled") return true;
        if (key === "services.rateLimit.windowSeconds") return 60;
        if (key === "services.rateLimit.maxRequests") return 300;
        return undefined;
      }),
    };
    const middleware = new RateLimitMiddleware(redis as any, config as any);
    const next = jest.fn();

    await middleware.use(
      {
        headers: {},
        ip: "203.0.113.42",
      } as any,
      {} as any,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      "operation=rate_limit outcome=disabled reason=redis_unavailable",
    );
    const output = JSON.stringify(warn.mock.calls);
    expect(output).not.toContain(rawError);
    expect(output).not.toContain("203.0.113.42");
  });
});
