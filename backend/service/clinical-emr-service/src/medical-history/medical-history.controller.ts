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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MedicalHistoryService } from './medical-history.service';
import { CreateMedicalHistoryDto } from './dto/create-medical-history.dto';
import { UpdateMedicalHistoryDto } from './dto/update-medical-history.dto';
import { MedicalHistoryResponseDto } from './dto/medical-history-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Medical Records')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('patients/:patient_id/history')
export class MedicalHistoryController {
  constructor(private readonly service: MedicalHistoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add Medical History entry for a patient' })
  @ApiCreatedResponse({ type: MedicalHistoryResponseDto })
  create(@Body() dto: CreateMedicalHistoryDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all Medical History entries for a patient' })
  @ApiOkResponse({ type: [MedicalHistoryResponseDto] })
  findAll(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.service.findByPatient(patient_id);
  }

  @Get(':history_id')
  @ApiOperation({ summary: 'Get a single Medical History entry' })
  @ApiOkResponse({ type: MedicalHistoryResponseDto })
  @ApiNotFoundResponse({ description: 'History entry not found' })
  findOne(@Param('history_id', ParseUUIDPipe) history_id: string) {
    return this.service.findOne(history_id);
  }

  @Patch(':history_id')
  @ApiOperation({ summary: 'Update a Medical History entry' })
  @ApiOkResponse({ type: MedicalHistoryResponseDto })
  @ApiNotFoundResponse({ description: 'History entry not found' })
  update(
    @Param('history_id', ParseUUIDPipe) history_id: string,
    @Body() dto: UpdateMedicalHistoryDto,
  ) {
    return this.service.update(history_id, dto);
  }

  @Delete(':history_id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a Medical History entry' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'History entry not found' })
  remove(@Param('history_id', ParseUUIDPipe) history_id: string) {
    return this.service.remove(history_id);
  }
}
