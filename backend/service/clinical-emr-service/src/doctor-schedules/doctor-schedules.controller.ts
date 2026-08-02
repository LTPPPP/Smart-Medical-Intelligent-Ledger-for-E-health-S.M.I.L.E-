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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { DoctorSchedulesService } from './doctor-schedules.service';
import { CreateDoctorScheduleDto } from './dto/create-doctor-schedule.dto';
import { UpdateDoctorScheduleDto } from './dto/update-doctor-schedule.dto';
import { QueryDoctorScheduleDto } from './dto/query-doctor-schedule.dto';
import { TransferScheduleDto } from './dto/transfer-schedule.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

@ApiTags('Doctors')
@Controller({
  path: 'doctor-schedules',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorSchedulesController {
  constructor(
    private readonly doctorSchedulesService: DoctorSchedulesService,
  ) {}

  @Roles(
    RoleEnum.ADMIN,
    RoleEnum.MANAGER,
    RoleEnum.DOCTOR,
    RoleEnum.RECEPTIONIST,
  )
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

  @Roles(
    RoleEnum.ADMIN,
    RoleEnum.MANAGER,
    RoleEnum.DOCTOR,
    RoleEnum.RECEPTIONIST,
  )
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

  @Roles(
    RoleEnum.ADMIN,
    RoleEnum.MANAGER,
    RoleEnum.DOCTOR,
    RoleEnum.RECEPTIONIST,
  )
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
