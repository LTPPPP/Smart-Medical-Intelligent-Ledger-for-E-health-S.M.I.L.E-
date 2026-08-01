import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WorkShiftsService } from './work-shifts.service';
import { CreateWorkShiftDto } from './dto/create-work-shift.dto';
import { UpdateWorkShiftDto } from './dto/update-work-shift.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

@ApiTags('Work Shifts')
@Controller({
  path: 'work-shifts',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkShiftsController {
  constructor(private readonly workShiftsService: WorkShiftsService) {}

  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a work shift' })
  create(@Body() dto: CreateWorkShiftDto) {
    return this.workShiftsService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all work shifts' })
  findAll() {
    return this.workShiftsService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get work shift detail' })
  findOne(@Param('id') id: string) {
    return this.workShiftsService.findById(id);
  }

  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update work shift' })
  update(@Param('id') id: string, @Body() dto: UpdateWorkShiftDto) {
    return this.workShiftsService.update(id, dto);
  }

  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete work shift' })
  remove(@Param('id') id: string) {
    return this.workShiftsService.remove(id);
  }
}
