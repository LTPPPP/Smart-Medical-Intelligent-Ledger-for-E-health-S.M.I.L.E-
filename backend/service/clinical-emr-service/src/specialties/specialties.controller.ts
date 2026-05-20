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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SpecialtiesService } from './specialties.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';

@ApiTags('Doctors')
@Controller({
  path: 'specialties',
  version: '1',
})
export class SpecialtiesController {
  constructor(private readonly specialtiesService: SpecialtiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'UC-063: Add specialty' })
  @ApiResponse({ status: 201, description: 'Specialty created' })
  create(@Body() dto: CreateSpecialtyDto) {
    return this.specialtiesService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-062: List specialties' })
  @ApiQuery({ name: 'active_only', required: false, type: Boolean })
  findAll(@Query('active_only') activeOnly?: boolean) {
    return this.specialtiesService.findAll(activeOnly);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get specialty detail' })
  findOne(@Param('id') id: string) {
    return this.specialtiesService.findById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-064: Update specialty' })
  update(@Param('id') id: string, @Body() dto: UpdateSpecialtyDto) {
    return this.specialtiesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'UC-065: Delete specialty' })
  remove(@Param('id') id: string) {
    return this.specialtiesService.remove(id);
  }
}
