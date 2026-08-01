import { Controller, Get } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { SwaggerAggregatorService } from "./swagger-aggregator.service";

@ApiExcludeController()
@Controller("swagger")
export class SwaggerController {
  constructor(private readonly aggregatorService: SwaggerAggregatorService) {}

  // Force Refresh Spec
  @Get("refresh")
  async refresh() {
    const spec = await this.aggregatorService.refresh();
    const pathCount = spec?.paths ? Object.keys(spec.paths).length : 0;
    const tagCount = spec?.tags?.length || 0;
    return {
      status: "ok",
      message: "Swagger aggregation refreshed",
      paths: pathCount,
      tags: tagCount,
    };
  }
}
