import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DentalChartsService } from './dental-charts.service';
import { CreateDentalChartDto } from './dto/create-dental-chart.dto';
import { UpdateDentalChartDto } from './dto/update-dental-chart.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

// Staff/clinician-only — patient PHI; a PATIENT must not reach these endpoints.
@ApiTags('Dental Charts')
@Controller('dental-charts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR)
export class DentalChartsController {
  constructor(private readonly dentalChartsService: DentalChartsService) {}

  @Post()
  create(@Body() createDentalChartDto: CreateDentalChartDto) {
    return this.dentalChartsService.create(createDentalChartDto);
  }

  @Get()
  findAll() {
    return this.dentalChartsService.findAll();
  }

  @Get(':chart_id')
  findOne(@Param('chart_id', ParseUUIDPipe) chart_id: string) {
    return this.dentalChartsService.findOne(chart_id);
  }

  @Get('patient/:patient_id')
  findByPatientId(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.dentalChartsService.findByPatientId(patient_id);
  }

  @Get('record/:record_id')
  findByRecordId(@Param('record_id', ParseUUIDPipe) record_id: string) {
    return this.dentalChartsService.findByRecordId(record_id);
  }

  @Patch(':chart_id')
  update(
    @Param('chart_id', ParseUUIDPipe) chart_id: string,
    @Body() updateDentalChartDto: UpdateDentalChartDto,
  ) {
    return this.dentalChartsService.update(chart_id, updateDentalChartDto);
  }

  @Delete(':chart_id')
  remove(@Param('chart_id', ParseUUIDPipe) chart_id: string) {
    return this.dentalChartsService.remove(chart_id);
  }
}
