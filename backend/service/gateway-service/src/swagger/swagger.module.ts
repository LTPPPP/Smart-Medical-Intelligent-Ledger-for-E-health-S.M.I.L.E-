import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { SwaggerAggregatorService } from "./swagger-aggregator.service";
import { SwaggerController } from "./swagger.controller";

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 3,
    }),
  ],
  controllers: [SwaggerController],
  providers: [SwaggerAggregatorService],
  exports: [SwaggerAggregatorService],
})
export class SwaggerModule_ {}
