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
import { MedicalHistoryService } from './medical-history.service';
import { CreateMedicalHistoryDto } from './dto/create-medical-history.dto';
import { UpdateMedicalHistoryDto } from './dto/update-medical-history.dto';

@ApiTags('Medical Records')
@Controller('patients/:patient_id/history')
export class MedicalHistoryController {
  constructor(private readonly service: MedicalHistoryService) {}

  @Post()
  create(@Body() dto: CreateMedicalHistoryDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.service.findByPatient(patient_id);
  }

  @Get(':history_id')
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
