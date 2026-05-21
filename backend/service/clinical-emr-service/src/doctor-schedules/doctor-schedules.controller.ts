import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { DoctorSchedulesService } from './doctor-schedules.service';
import { CreateDoctorScheduleDto } from './dto/create-doctor-schedule.dto';
import { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto';
import { QueryDoctorScheduleDto } from './dto/query-doctor-schedule.dto';
import { TransferScheduleDto } from './dto/transfer-schedule.dto';

@ApiTags('Doctors')
@Controller({
  path: 'doctor-schedules',
  version: '1',
})
export class DoctorSchedulesController {
  constructor(
    private readonly doctorSchedulesService: DoctorSchedulesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'UC-030: Create doctor work schedule' })
  create(@Body() dto: CreateDoctorScheduleDto) {
    return this.doctorSchedulesService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-030/032: List schedules with filters' })
  findAll(@Query() query: QueryDoctorScheduleDto) {
    return this.doctorSchedulesService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get schedule detail by ID' })
  @ApiParam({ name: 'id', description: 'Schedule UUID' })
  async findOne(@Param('id') id: string) {
    const schedule = await this.doctorSchedulesService.findById(id);
    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }
    return schedule;
  }

  @Get('doctor/:doctorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-032: Get doctor personal schedule' })
  @ApiParam({ name: 'doctorId', description: 'Doctor UUID' })
  findByDoctor(
    @Param('doctorId') doctorId: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
    return this.doctorSchedulesService.findByDoctor(doctorId, dateFrom, dateTo);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-031: Update schedule with audit log' })
  @ApiParam({ name: 'id', description: 'Schedule UUID' })
  update(@Param('id') id: string, @Body() dto: UpdateDoctorScheduleDto) {
    return this.doctorSchedulesService.update(id, dto);
  }

  @Get(':id/changes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-031: Get schedule change history' })
  @ApiParam({ name: 'id', description: 'Schedule UUID' })
  getChangeHistory(@Param('id') id: string) {
    return this.doctorSchedulesService.getChangeHistory(id);
  }

  @Post(':id/transfer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'UC-035/036: Transfer shift to another doctor with audit log and notification',
  })
  @ApiParam({ name: 'id', description: 'Schedule UUID' })
  async transferShift(
    @Param('id') id: string,
    @Body() dto: TransferScheduleDto,
  ) {
    return this.doctorSchedulesService.transferShift(id, dto);
  }
}
