import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreatePatientRepresentativeDto } from './dto/create-patient-representative.dto';
import { UpdatePatientRepresentativeDto } from './dto/update-patient-representative.dto';
import { PatientRepresentativesService } from './patient-representatives.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentActor } from '../auth/current-actor.decorator';
import { Actor } from '../auth/actor.util';

// All roles (PATIENT included) need access — patients manage their own
// representatives. Row-level ownership is enforced in the service layer.
@ApiTags('Patient Representatives')
@Controller('patient-representatives')
@UseGuards(JwtAuthGuard)
export class PatientRepresentativesController {
  constructor(
    private readonly patientRepresentativesService: PatientRepresentativesService,
  ) {}

  @Post()
  create(
    @Body() dto: CreatePatientRepresentativeDto,
    @CurrentActor() actor: Actor,
  ) {
    return this.patientRepresentativesService.create(
      dto,
      actor.accountId,
      actor.role,
    );
  }

  @Get('patient/:patientId')
  findByPatient(
    @Param('patientId') patientId: string,
    @CurrentActor() actor: Actor,
  ) {
    return this.patientRepresentativesService.findByPatient(
      patientId,
      actor.accountId,
      actor.role,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.patientRepresentativesService.findOne(
      id,
      actor.accountId,
      actor.role,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientRepresentativeDto,
    @CurrentActor() actor: Actor,
  ) {
    return this.patientRepresentativesService.update(
      id,
      dto,
      actor.accountId,
      actor.role,
    );
  }

  @Post(':id/verify')
  verify(@Param('id') id: string, @CurrentActor() actor: Actor) {
    return this.patientRepresentativesService.verify(
      id,
      actor.accountId,
      actor.role,
    );
  }
}
