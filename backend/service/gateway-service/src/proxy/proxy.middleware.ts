import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { fixRequestBody } from 'http-proxy-middleware';
import { FlattenedRoute } from './proxy-route.config';

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
      proxy(req, res, next);
    };
  }
}
