import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TreatmentPlansService } from './treatment-plans.service';
import { CreateTreatmentPlanDto } from './dto/create-treatment-plan.dto';
import { UpdateTreatmentPlanDto } from './dto/update-treatment-plan.dto';

@ApiTags('Treatments')
@Controller('treatment-plans')
export class TreatmentPlansController {
  constructor(private readonly treatmentPlansService: TreatmentPlansService) {}

  @Post()
  create(@Body() createTreatmentPlanDto: CreateTreatmentPlanDto) {
    return this.treatmentPlansService.create(createTreatmentPlanDto);
  }

  @Get()
  findAll() {
    return this.treatmentPlansService.findAll();
  }

  @Get(':plan_id')
  findOne(@Param('plan_id', ParseUUIDPipe) plan_id: string) {
    return this.treatmentPlansService.findOne(plan_id);
  }

  @Get('patient/:patient_id')
  findByPatientId(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.treatmentPlansService.findByPatientId(patient_id);
  }

  @Get('record/:record_id')
  findByRecordId(@Param('record_id', ParseUUIDPipe) record_id: string) {
    return this.treatmentPlansService.findByRecordId(record_id);
  }

  @Patch(':plan_id')
  update(
    @Param('plan_id', ParseUUIDPipe) plan_id: string,
    @Body() updateTreatmentPlanDto: UpdateTreatmentPlanDto,
  ) {
    return this.treatmentPlansService.update(plan_id, updateTreatmentPlanDto);
  }

  @Delete(':plan_id')
  remove(@Param('plan_id', ParseUUIDPipe) plan_id: string) {
    return this.treatmentPlansService.remove(plan_id);
  }
}
