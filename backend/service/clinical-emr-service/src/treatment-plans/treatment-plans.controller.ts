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
import { AcceptTreatmentPlanDto } from './dto/accept-treatment-plan.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';

@ApiTags('Treatments')
@Controller('treatment-plans')
@Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR)
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

  @Get('patient/:patient_id')
  findByPatientId(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.treatmentPlansService.findByPatientId(patient_id);
  }

  @Get('session/:session_id')
  findBySessionId(@Param('session_id', ParseUUIDPipe) session_id: string) {
    return this.treatmentPlansService.findBySessionId(session_id);
  }

  @Get('record/:record_id')
  findByRecordId(@Param('record_id', ParseUUIDPipe) record_id: string) {
    return this.treatmentPlansService.findByRecordId(record_id);
  }

  @Get(':plan_id')
  findOne(@Param('plan_id', ParseUUIDPipe) plan_id: string) {
    return this.treatmentPlansService.findOne(plan_id);
  }

  @Patch(':plan_id/propose')
  propose(@Param('plan_id', ParseUUIDPipe) plan_id: string) {
    return this.treatmentPlansService.propose(plan_id);
  }

  @Patch(':plan_id/accept')
  accept(
    @Param('plan_id', ParseUUIDPipe) plan_id: string,
    @Body() dto: AcceptTreatmentPlanDto,
  ) {
    return this.treatmentPlansService.accept(plan_id, dto.accepted_by, {
      acceptance_scope: dto.acceptance_scope,
      accepted_scope_note: dto.accepted_scope_note,
    });
  }

  @Patch(':plan_id/decline')
  decline(
    @Param('plan_id', ParseUUIDPipe) plan_id: string,
    @Body('declined_by') declined_by: string,
    @Body('reason') reason?: string,
  ) {
    return this.treatmentPlansService.decline(plan_id, declined_by, reason);
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
