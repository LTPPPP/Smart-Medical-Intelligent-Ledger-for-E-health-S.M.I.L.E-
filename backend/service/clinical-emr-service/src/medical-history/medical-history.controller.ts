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
import { MedicalHistoryService } from './medical-history.service';
import { CreateMedicalHistoryDto } from './dto/create-medical-history.dto';
import { UpdateMedicalHistoryDto } from './dto/update-medical-history.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

@ApiTags('Medical Records')
@Controller('patients/:patient_id/history')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR)
export class MedicalHistoryController {
  constructor(private readonly service: MedicalHistoryService) {}

  @Post()
  create(@Body() dto: CreateMedicalHistoryDto) {
    return this.service.create(dto);
  }

  // B3.3: nurse must review allergy/medical-alert history before treatment —
  // read-only; authoring history stays Doctor/Admin (class default).
  @Get()
  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR, RoleEnum.NURSE)
  findAll(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.service.findByPatient(patient_id);
  }

  @Get(':history_id')
  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR, RoleEnum.NURSE)
  findOne(@Param('history_id', ParseUUIDPipe) history_id: string) {
    return this.service.findOne(history_id);
  }

  @Patch(':history_id')
  update(
    @Param('history_id', ParseUUIDPipe) history_id: string,
    @Body() dto: UpdateMedicalHistoryDto,
  ) {
    return this.service.update(history_id, dto);
  }

  @Delete(':history_id')
  remove(@Param('history_id', ParseUUIDPipe) history_id: string) {
    return this.service.remove(history_id);
  }
}
