import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import {
  ReportsService,
  DoctorPerformanceQuery,
  DoctorDashboardQuery,
  PatientDashboardQuery,
} from './reports.service';
import { RevenueQueryDto } from './dto/revenue-query.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

@ApiTags('Reports')
@Controller({ path: 'reports', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR)
  @Get('doctor-performance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View doctor performance report — appointment stats per doctor',
  })
  @ApiQuery({ name: 'doctor_id', required: false, type: String })
  @ApiQuery({ name: 'clinic_id', required: false, type: String })
  @ApiQuery({
    name: 'date_from',
    required: true,
    type: String,
    example: '2026-01-01',
  })
  @ApiQuery({
    name: 'date_to',
    required: true,
    type: String,
    example: '2026-12-31',
  })
  getDoctorPerformance(
    @Query('date_from') date_from: string,
    @Query('date_to') date_to: string,
    @Query('doctor_id') doctor_id?: string,
    @Query('clinic_id') clinic_id?: string,
  ) {
    return this.reportsService.getDoctorPerformance({
      doctor_id,
      clinic_id,
      date_from,
      date_to,
    } as DoctorPerformanceQuery);
  }

  @Roles(RoleEnum.ADMIN)
  @Get('revenue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'View revenue / financial report — paid appointment revenue aggregated by day, service and clinic',
  })
  @ApiQuery({
    name: 'date_from',
    required: true,
    type: String,
    example: '2026-01-01',
  })
  @ApiQuery({
    name: 'date_to',
    required: true,
    type: String,
    example: '2026-12-31',
  })
  @ApiQuery({ name: 'clinic_id', required: false, type: String })
  @ApiQuery({
    name: 'group_by',
    required: false,
    enum: ['day', 'service', 'clinic'],
  })
  getRevenue(@Query() query: RevenueQueryDto) {
    return this.reportsService.getRevenue({
      date_from: query.date_from,
      date_to: query.date_to,
      clinic_id: query.clinic_id,
      group_by: query.group_by,
    });
  }

  @Roles(RoleEnum.ADMIN)
  @Get('operational')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'View operational report — appointment volume and outcome rates (no-show, cancellation, completion)',
  })
  @ApiQuery({
    name: 'date_from',
    required: true,
    type: String,
    example: '2026-01-01',
  })
  @ApiQuery({
    name: 'date_to',
    required: true,
    type: String,
    example: '2026-12-31',
  })
  @ApiQuery({ name: 'clinic_id', required: false, type: String })
  getOperational(@Query() query: RevenueQueryDto) {
    return this.reportsService.getOperationalReport({
      date_from: query.date_from,
      date_to: query.date_to,
      clinic_id: query.clinic_id,
    });
  }

  @Roles(RoleEnum.ADMIN, RoleEnum.DOCTOR)
  @Get('dashboard/doctor')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "View doctor dashboard — today's appointments and upcoming 7-day schedule",
  })
  @ApiQuery({ name: 'doctor_id', required: true, type: String })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    example: '2026-05-16',
  })
  getDoctorDashboard(
    @Query('doctor_id') doctor_id: string,
    @Query('date') date?: string,
  ) {
    return this.reportsService.getDoctorDashboard({
      doctor_id,
      date,
    } as DoctorDashboardQuery);
  }

  @Get('dashboard/patient')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'View patient dashboard — upcoming appointments, active treatment plans, recent sessions',
  })
  @ApiQuery({ name: 'patient_id', required: true, type: String })
  getPatientDashboard(@Query('patient_id') patient_id: string) {
    return this.reportsService.getPatientDashboard({
      patient_id,
    } as PatientDashboardQuery);
  }
}
