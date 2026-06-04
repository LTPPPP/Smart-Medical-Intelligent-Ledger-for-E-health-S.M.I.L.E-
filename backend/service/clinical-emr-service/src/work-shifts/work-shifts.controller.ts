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
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WorkShiftsService } from './work-shifts.service';
import { CreateWorkShiftDto } from './dto/create-work-shift.dto';
import { UpdateWorkShiftDto } from './dto/update-work-shift.dto';

@ApiTags('Work Shifts')
@Controller({
  path: 'work-shifts',
  version: '1',
})
export class WorkShiftsController {
  constructor(private readonly workShiftsService: WorkShiftsService) {}

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

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update work shift' })
  update(@Param('id') id: string, @Body() dto: UpdateWorkShiftDto) {
    return this.workShiftsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete work shift' })
  remove(@Param('id') id: string) {
    return this.workShiftsService.remove(id);
  }
}
