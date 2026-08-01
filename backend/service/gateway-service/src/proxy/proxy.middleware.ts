import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import { Request, Response, NextFunction } from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { fixRequestBody } from "http-proxy-middleware";
import { FlattenedRoute } from "./proxy-route.config";
import { sanitizeLogPath } from "../common/sanitize-log-path";
import {
  ensureCorrelationId,
  setCorrelationId,
} from "../common/correlation-id";

const CLOCK_SKEW_SECONDS = 60;

interface JwtPayload {
  accountId?: unknown;
  role?: unknown;
  exp?: unknown;
  nbf?: unknown;
}

export interface TrustedActor {
  accountId: string;
  role?: string;
}

export function extractTrustedActorFromAuthorization(
  authorization: string | undefined,
  secret: string | undefined,
): TrustedActor | null {
  if (!authorization || !secret) return null;
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const parts = match[1].split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, signature] = parts;
  try {
    const header = JSON.parse(
      Buffer.from(encodedHeader, "base64url").toString("utf8"),
    ) as { alg?: string };
    if (header.alg !== "HS256") return null;
    const expectedSignature = createHmac("sha256", secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");
    const expected = Buffer.from(expectedSignature);
    const received = Buffer.from(signature);
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      return null;
    }
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as JwtPayload;
    const now = Math.floor(Date.now() / 1000);
    // `exp` is mandatory — a token issued without it would never expire, and
    // this service has no revocation channel of its own.
    if (typeof payload.exp !== 'number' || payload.exp <= now) {
      return null;
    }
    if (
      typeof payload.nbf === "number" &&
      payload.nbf > now + CLOCK_SKEW_SECONDS
    ) {
      return null;
    }
    if (typeof payload.accountId !== "string" || !payload.accountId) {
      return null;
    }
    return {
      accountId: payload.accountId,
      role:
        typeof payload.role === "string" && payload.role
          ? payload.role
          : undefined,
    };
  } catch {
    return null;
  }
}

export function extractTrustedPatientIdFromAuthorization(
  authorization: string | undefined,
  secret: string | undefined,
): string | null {
  return (
    extractTrustedActorFromAuthorization(authorization, secret)?.accountId ??
    null
  );
}

function requiresTrustedIdentity(route: FlattenedRoute): boolean {
  return (
    route.serviceName === "booking-langgraph-service" ||
    route.prefix === "/api/v1/appointments" ||
    route.prefix === "/api/v1/patient-representatives"
  );
}

@Injectable()
export class ProxyMiddlewareFactory {
  private readonly logger = new Logger("ProxyMiddleware");
  private readonly proxyCache = new Map<
    string,
    ReturnType<typeof createProxyMiddleware>
  >();
  private readonly requestStartTimes = new WeakMap<object, number>();

  createMiddleware(
    route: FlattenedRoute,
    timeout: number,
  ): NestMiddleware["use"] {
    const cacheKey = `${route.serviceName}:${route.prefix}`;

    if (!this.proxyCache.has(cacheKey)) {
      const options: Options = {
        target: route.target,
        changeOrigin: true,
        pathRewrite: route.pathRewrite,
        timeout,
        proxyTimeout: timeout,
        on: {
          proxyReq: (proxyReq, req) => {
            this.requestStartTimes.set(req, Date.now());
            const trustedUserId = req.headers["x-auth-user-id"];
            const trustedPatientId = req.headers["x-patient-id"];
            const trustedRole = req.headers["x-auth-role"];
            if (trustedUserId) {
              proxyReq.setHeader("x-auth-user-id", trustedUserId);
            }
            if (trustedPatientId) {
              proxyReq.setHeader("x-patient-id", trustedPatientId);
            }
            if (trustedRole) {
              proxyReq.setHeader("x-auth-role", trustedRole);
            }
            fixRequestBody(proxyReq, req as Request);
          },
          proxyRes: (proxyRes, req) => {
            const correlationId = ensureCorrelationId(req as Request);
            proxyRes.headers["x-correlation-id"] = correlationId;
            const startedAt = this.requestStartTimes.get(req) ?? Date.now();
            this.logger.debug(
              `service=${route.serviceName} method=${req.method} path=${sanitizeLogPath(req.url)} status=${proxyRes.statusCode ?? 0} durationMs=${Date.now() - startedAt} correlationId=${correlationId}`,
            );
            this.requestStartTimes.delete(req);
            // Strip Upstream CORS
            delete proxyRes.headers["access-control-allow-origin"];
            delete proxyRes.headers["access-control-allow-credentials"];
            delete proxyRes.headers["access-control-allow-methods"];
            delete proxyRes.headers["access-control-allow-headers"];
            delete proxyRes.headers["access-control-expose-headers"];
            delete proxyRes.headers["access-control-max-age"];
          },
          error: (_err, req, res) => {
            const startedAt = this.requestStartTimes.get(req) ?? Date.now();
            const correlationId = ensureCorrelationId(req as Request);
            this.logger.error(
              `service=${route.serviceName} method=${req.method} path=${sanitizeLogPath(req.url)} status=502 durationMs=${Date.now() - startedAt} correlationId=${correlationId}`,
            );
            this.requestStartTimes.delete(req);
            if (res && "writeHead" in res && !res.headersSent) {
              setCorrelationId(res as Response, correlationId);
              (res as Response).status(502).json({
                statusCode: 502,
                message: `Service "${route.serviceName}" is unavailable`,
                error: "Bad Gateway",
                correlationId,
              });
            }
          },
        },
      };

      this.proxyCache.set(cacheKey, createProxyMiddleware(options));
    }

    const proxy = this.proxyCache.get(cacheKey)!;
    return (req: Request, res: Response, next: NextFunction) => {
      const correlationId = ensureCorrelationId(req);
      setCorrelationId(res, correlationId);
      const trustedActor = extractTrustedActorFromAuthorization(
        req.headers.authorization,
        process.env.AUTH_JWT_SECRET,
      );
      if (requiresTrustedIdentity(route) && !trustedActor) {
        setCorrelationId(res, correlationId);
        res.status(401).json({
          statusCode: 401,
          message: "Valid authentication is required for this route",
          error: "Unauthorized",
          correlationId,
        });
        return;
      }
      // Clear Identity Headers
      delete req.headers["x-auth-user-id"];
      delete req.headers["x-patient-id"];
      delete req.headers["x-auth-role"];
      if (trustedActor) {
        req.headers["x-auth-user-id"] = trustedActor.accountId;
        req.headers["x-patient-id"] = trustedActor.accountId;
        if (trustedActor.role) {
          req.headers["x-auth-role"] = trustedActor.role;
        }
      }
      proxy(req, res, next);
    };
  }
}
