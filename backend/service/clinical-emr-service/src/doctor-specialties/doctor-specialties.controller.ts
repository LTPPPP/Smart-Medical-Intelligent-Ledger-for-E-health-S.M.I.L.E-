import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DoctorSpecialtiesService } from './doctor-specialties.service';
import { CreateDoctorSpecialtyDto } from './dto/create-doctor-specialty.dto';

@ApiTags('Doctors')
@Controller({
  path: 'doctor-specialties',
  version: '1',
})
export class DoctorSpecialtiesController {
  constructor(
    private readonly doctorSpecialtiesService: DoctorSpecialtiesService,
  ) {}

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
