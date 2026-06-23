import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { fixRequestBody } from 'http-proxy-middleware';
import { FlattenedRoute } from './proxy-route.config';

interface JwtPayload {
  accountId?: unknown;
  exp?: unknown;
}

export function extractTrustedPatientIdFromAuthorization(
  authorization: string | undefined,
  secret: string | undefined,
): string | null {
  if (!authorization || !secret) return null;
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const parts = match[1].split('.');
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, signature] = parts;
  try {
    const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8')) as { alg?: string };
    if (header.alg !== 'HS256') return null;
    const expectedSignature = createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    const expected = Buffer.from(expectedSignature);
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as JwtPayload;
    if (typeof payload.exp === 'number' && payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return typeof payload.accountId === 'string' && payload.accountId ? payload.accountId : null;
  } catch {
    return null;
  }
}

@Injectable()
export class ProxyMiddlewareFactory {
  private readonly logger = new Logger('ProxyMiddleware');
  private readonly proxyCache = new Map<string, ReturnType<typeof createProxyMiddleware>>();

  createMiddleware(
    route: FlattenedRoute,
    timeout: number,
  ): NestMiddleware['use'] {
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
            fixRequestBody(proxyReq, req as Request);
            this.logger.debug(
              `[${route.serviceName}] ${req.method} ${req.url} -> ${route.target}`,
            );
          },
          proxyRes: (proxyRes, req) => {
            this.logger.debug(
              `[${route.serviceName}] ${req.method} ${req.url} <- ${proxyRes.statusCode}`,
            );
            // Strip upstream CORS headers — gateway owns CORS, not upstream services
            delete proxyRes.headers['access-control-allow-origin'];
            delete proxyRes.headers['access-control-allow-credentials'];
            delete proxyRes.headers['access-control-allow-methods'];
            delete proxyRes.headers['access-control-allow-headers'];
            delete proxyRes.headers['access-control-expose-headers'];
            delete proxyRes.headers['access-control-max-age'];
          },
          error: (err, req, res) => {
            this.logger.error(
              `[${route.serviceName}] Proxy error for ${req.method} ${req.url}: ${err.message}`,
            );
            if (res && 'writeHead' in res && !res.headersSent) {
              (res as Response).status(502).json({
                statusCode: 502,
                message: `Service "${route.serviceName}" is unavailable`,
                error: 'Bad Gateway',
              });
            }
          },
        },
      };

      this.proxyCache.set(cacheKey, createProxyMiddleware(options));
    }

    const proxy = this.proxyCache.get(cacheKey)!;
    return (req: Request, res: Response, next: NextFunction) => {
      const trustedUserId = extractTrustedPatientIdFromAuthorization(
        req.headers.authorization,
        process.env.AUTH_JWT_SECRET,
      );
      if (route.serviceName === 'booking-langgraph-service' && !trustedUserId) {
        res.status(401).json({
          statusCode: 401,
          message: 'Valid authentication is required for booking chat',
          error: 'Unauthorized',
        });
        return;
      }
      if (trustedUserId) {
        req.headers['x-auth-user-id'] = trustedUserId;
        req.headers['x-patient-id'] = trustedUserId;
      }
      proxy(req, res, next);
    };
  }
}
