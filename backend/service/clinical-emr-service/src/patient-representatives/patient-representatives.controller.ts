import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreatePatientRepresentativeDto } from './dto/create-patient-representative.dto';
import { UpdatePatientRepresentativeDto } from './dto/update-patient-representative.dto';
import { PatientRepresentativesService } from './patient-representatives.service';

@ApiTags('Patient Representatives')
@Controller('patient-representatives')
export class PatientRepresentativesController {
  constructor(
    private readonly patientRepresentativesService: PatientRepresentativesService,
  ) {}

  @Post()
  create(
    @Body() dto: CreatePatientRepresentativeDto,
    @Headers('x-auth-user-id') actorUserId?: string,
    @Headers('x-auth-role') actorRole?: string,
  ) {
    this.assertActor(actorUserId);
    return this.patientRepresentativesService.create(
      dto,
      actorUserId,
      actorRole,
    );
  }

  @Get('patient/:patientId')
  findByPatient(
    @Param('patientId') patientId: string,
    @Headers('x-auth-user-id') actorUserId?: string,
    @Headers('x-auth-role') actorRole?: string,
  ) {
    this.assertActor(actorUserId);
    return this.patientRepresentativesService.findByPatient(
      patientId,
      actorUserId,
      actorRole,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Headers('x-auth-user-id') actorUserId?: string,
    @Headers('x-auth-role') actorRole?: string,
  ) {
    this.assertActor(actorUserId);
    return this.patientRepresentativesService.findOne(
      id,
      actorUserId,
      actorRole,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientRepresentativeDto,
    @Headers('x-auth-user-id') actorUserId?: string,
    @Headers('x-auth-role') actorRole?: string,
  ) {
    this.assertActor(actorUserId);
    return this.patientRepresentativesService.update(
      id,
      dto,
      actorUserId,
      actorRole,
    );
  }

  @Post(':id/verify')
  verify(
    @Param('id') id: string,
    @Headers('x-auth-user-id') actorUserId?: string,
    @Headers('x-auth-role') actorRole?: string,
  ) {
    this.assertActor(actorUserId);
    return this.patientRepresentativesService.verify(
      id,
      actorUserId,
      actorRole,
    );
  }

  private assertActor(actorUserId?: string): asserts actorUserId is string {
    if (!actorUserId) {
      throw new BadRequestException('x-auth-user-id header is required');
    }
  }
}
