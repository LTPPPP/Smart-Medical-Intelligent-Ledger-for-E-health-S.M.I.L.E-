import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { servicesConfig } from "./config/services.config";
import { RedisModule } from "./redis/redis.module";
import { ProxyModule } from "./proxy/proxy.module";
import { HealthModule } from "./health/health.module";
import { SwaggerModule_ } from "./swagger/swagger.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [servicesConfig],
    }),
    RedisModule,
    HealthModule,
    SwaggerModule_,
    ProxyModule,
  ],
})
export class AppModule {}
