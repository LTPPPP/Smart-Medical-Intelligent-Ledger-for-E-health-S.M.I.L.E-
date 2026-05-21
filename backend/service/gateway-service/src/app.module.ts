import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { servicesConfig } from "./config/services.config";
import { ProxyModule } from "./proxy/proxy.module";
import { HealthModule } from "./health/health.module";
import { SwaggerModule_ } from "./swagger/swagger.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [servicesConfig],
    }),
    HealthModule,
    SwaggerModule_,
    ProxyModule,
  ],
})
export class AppModule {}
