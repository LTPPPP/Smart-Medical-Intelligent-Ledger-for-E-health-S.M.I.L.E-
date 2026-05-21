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
import { DiagnosesService } from './diagnoses.service';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';

@ApiTags('Diagnoses')
@Controller('diagnoses')
export class DiagnosesController {
  constructor(private readonly diagnosesService: DiagnosesService) {}

  @Post()
  create(@Body() createDiagnosisDto: CreateDiagnosisDto) {
    return this.diagnosesService.create(createDiagnosisDto);
  }

  @Get()
  findAll() {
    return this.diagnosesService.findAll();
  }

  @Get(':diagnosis_id')
  findOne(@Param('diagnosis_id', ParseUUIDPipe) diagnosis_id: string) {
    return this.diagnosesService.findOne(diagnosis_id);
  }

  @Get('session/:session_id')
  findBySessionId(@Param('session_id', ParseUUIDPipe) session_id: string) {
    return this.diagnosesService.findBySessionId(session_id);
  }

  @Get('icd/:icd_code')
  findByIcdCode(@Param('icd_code') icd_code: string) {
    return this.diagnosesService.findByIcdCode(icd_code);
  }

  @Patch(':diagnosis_id')
  update(
    @Param('diagnosis_id', ParseUUIDPipe) diagnosis_id: string,
    @Body() updateDiagnosisDto: UpdateDiagnosisDto,
  ) {
    return this.diagnosesService.update(diagnosis_id, updateDiagnosisDto);
  }

  @Delete(':diagnosis_id')
  remove(@Param('diagnosis_id', ParseUUIDPipe) diagnosis_id: string) {
    return this.diagnosesService.remove(diagnosis_id);
  }
}
