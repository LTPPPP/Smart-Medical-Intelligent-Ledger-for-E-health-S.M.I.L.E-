import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DoctorSpecialtiesService } from './doctor-specialties.service';
import { CreateDoctorSpecialtyDto } from './dto/create-doctor-specialty.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

@ApiTags('Doctors')
@Controller({
  path: 'doctor-specialties',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorSpecialtiesController {
  constructor(
    private readonly doctorSpecialtiesService: DoctorSpecialtiesService,
  ) {}

  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.RECEPTIONIST)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign a specialty to a doctor' })
  create(@Body() dto: CreateDoctorSpecialtyDto) {
    return this.doctorSpecialtiesService.create(dto);
  }

  @Get('doctor/:doctorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all specialties for a doctor' })
  findByDoctor(@Param('doctorId') doctorId: string) {
    return this.doctorSpecialtiesService.findByDoctor(doctorId);
  }

  @Get('specialty/:specialtyId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all doctors for a specialty' })
  findBySpecialty(@Param('specialtyId') specialtyId: string) {
    return this.doctorSpecialtiesService.findBySpecialty(specialtyId);
  }

  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.RECEPTIONIST)
  @Delete(':doctorId/:specialtyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a specialty from a doctor' })
  remove(
    @Param('doctorId') doctorId: string,
    @Param('specialtyId') specialtyId: string,
  ) {
    return this.doctorSpecialtiesService.remove(doctorId, specialtyId);
  }
}
