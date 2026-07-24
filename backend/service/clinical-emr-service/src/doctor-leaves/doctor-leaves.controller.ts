import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { DoctorLeavesService } from './doctor-leaves.service';
import { CreateDoctorLeaveDto } from './dto/create-doctor-leave.dto';
import { UpdateDoctorLeaveDto } from './dto/update-doctor-leave.dto';
import { QueryDoctorLeaveDto } from './dto/query-doctor-leave.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

@ApiTags('Doctors')
@Controller({
  path: 'doctor-leaves',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorLeavesController {
  constructor(private readonly doctorLeavesService: DoctorLeavesService) {}

  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR, RoleEnum.RECEPTIONIST)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'UC-033: Create leave request' })
  create(@Body() dto: CreateDoctorLeaveDto) {
    return this.doctorLeavesService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-033: List leaves with filters' })
  findAll(@Query() query: QueryDoctorLeaveDto) {
    return this.doctorLeavesService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get leave detail by ID' })
  @ApiParam({ name: 'id', description: 'Leave UUID' })
  async findOne(@Param('id') id: string) {
    const leave = await this.doctorLeavesService.findById(id);
    if (!leave) {
      throw new NotFoundException(`Leave with ID ${id} not found`);
    }
    return leave;
  }

  @Get('doctor/:doctorId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-033: Get leaves by doctor' })
  @ApiParam({ name: 'doctorId', description: 'Doctor UUID' })
  findByDoctor(
    @Param('doctorId') doctorId: string,
    @Query('status') status?: string,
  ) {
    return this.doctorLeavesService.findByDoctor(doctorId, status);
  }

  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR, RoleEnum.RECEPTIONIST)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-034: Approve/reject leave request' })
  @ApiParam({ name: 'id', description: 'Leave UUID' })
  update(@Param('id') id: string, @Body() dto: UpdateDoctorLeaveDto) {
    return this.doctorLeavesService.update(id, dto);
  }

  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR, RoleEnum.RECEPTIONIST)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete leave request' })
  @ApiParam({ name: 'id', description: 'Leave UUID' })
  remove(@Param('id') id: string) {
    return this.doctorLeavesService.remove(id);
  }
}
