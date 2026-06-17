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
import { TreatmentHistoryService } from './treatment-history.service';
import { CreateTreatmentHistoryDto } from './dto/create-treatment-history.dto';
import { UpdateTreatmentHistoryDto } from './dto/update-treatment-history.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';

@ApiTags('Treatments')
@Controller('treatment-history')
@Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR)
export class TreatmentHistoryController {
  constructor(
    private readonly treatmentHistoryService: TreatmentHistoryService,
  ) {}

  @Post()
  create(@Body() createTreatmentHistoryDto: CreateTreatmentHistoryDto) {
    return this.treatmentHistoryService.create(createTreatmentHistoryDto);
  }

  @Get()
  findAll() {
    return this.treatmentHistoryService.findAll();
  }

  @Get(':treatment_id')
  findOne(@Param('treatment_id', ParseUUIDPipe) treatment_id: string) {
    return this.treatmentHistoryService.findOne(treatment_id);
  }

  @Get('patient/:patient_id')
  findByPatientId(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.treatmentHistoryService.findByPatientId(patient_id);
  }

  @Get('record/:record_id')
  findByRecordId(@Param('record_id', ParseUUIDPipe) record_id: string) {
    return this.treatmentHistoryService.findByRecordId(record_id);
  }

  @Get('tooth/:tooth_number')
  findByToothNumber(@Param('tooth_number') tooth_number: string) {
    return this.treatmentHistoryService.findByToothNumber(
      parseInt(tooth_number, 10),
    );
  }

  @Patch(':treatment_id')
  update(
    @Param('treatment_id', ParseUUIDPipe) treatment_id: string,
    @Body() updateTreatmentHistoryDto: UpdateTreatmentHistoryDto,
  ) {
    return this.treatmentHistoryService.update(
      treatment_id,
      updateTreatmentHistoryDto,
    );
  }

  @Delete(':treatment_id')
  remove(@Param('treatment_id', ParseUUIDPipe) treatment_id: string) {
    return this.treatmentHistoryService.remove(treatment_id);
  }
}
