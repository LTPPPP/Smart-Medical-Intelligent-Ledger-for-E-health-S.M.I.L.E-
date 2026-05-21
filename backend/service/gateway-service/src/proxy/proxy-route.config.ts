import { ServiceRoute } from '../config/services.config';

export interface FlattenedRoute {
  prefix: string;
  target: string;
  pathRewrite: Record<string, string>;
  serviceName: string;
}

export function flattenRoutes(routes: ServiceRoute[]): FlattenedRoute[] {
  const flattened: FlattenedRoute[] = [];
  for (const route of routes) {
    for (const prefix of route.prefixes) {
      flattened.push({
        prefix,
        target: route.target,
        pathRewrite: route.pathRewrite,
        serviceName: route.name,
      });
    }
  }
  return flattened;
}
