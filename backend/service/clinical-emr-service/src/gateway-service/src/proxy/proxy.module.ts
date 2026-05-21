import {
  Module,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProxyMiddlewareFactory } from './proxy.middleware';
import { flattenRoutes } from './proxy-route.config';
import { ServiceRoute } from '../config/services.config';

@Module({
  providers: [ProxyMiddlewareFactory],
})
export class ProxyModule implements NestModule {
  private readonly logger = new Logger('ProxyModule');

  constructor(
    private readonly configService: ConfigService,
    private readonly proxyFactory: ProxyMiddlewareFactory,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    const routes = this.configService.get<ServiceRoute[]>('services.routes') || [];
    const timeout = this.configService.get<number>('services.gateway.proxyTimeout') || 30000;
    const flattened = flattenRoutes(routes);

    for (const route of flattened) {
      const middleware = this.proxyFactory.createMiddleware(route, timeout);

      consumer
        .apply(middleware as any)
        .forRoutes(
          { path: route.prefix, method: RequestMethod.ALL },
          { path: route.prefix + '/*path', method: RequestMethod.ALL },
        );

      this.logger.log(
        `Route ${route.prefix}(/*) -> ${route.target} [${route.serviceName}]`,
      );
    }
  }
}
