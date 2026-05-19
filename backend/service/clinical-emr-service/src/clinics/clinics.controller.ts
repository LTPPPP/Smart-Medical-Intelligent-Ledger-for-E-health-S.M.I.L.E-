import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ClinicsService } from './clinics.service';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { QueryClinicDto } from './dto/query-clinic.dto';

@ApiTags('Clinics')
@Controller({
  path: 'clinics',
  version: '1',
})
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-023: View clinic information' })
  @ApiResponse({ status: 200, description: 'List of clinics' })
  async findAll(@Query() query: QueryClinicDto) {
    const result = await this.clinicsService.findAll(query);
    return {
      data: result.data,
      meta: {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        total: result.total,
      },
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-024: View clinic details' })
  @ApiResponse({
    status: 200,
    description: 'Clinic detail with treatment rooms',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clinicsService.findById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-025: Update clinic information' })
  @ApiResponse({ status: 200, description: 'Clinic updated successfully' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClinicDto: UpdateClinicDto,
  ) {
    return this.clinicsService.update(id, updateClinicDto);
  }
}
