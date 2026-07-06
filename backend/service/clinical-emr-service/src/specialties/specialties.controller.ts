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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SpecialtiesService } from './specialties.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

@ApiTags('Doctors')
@Controller({
  path: 'specialties',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class SpecialtiesController {
  constructor(private readonly specialtiesService: SpecialtiesService) {}

  @Roles(RoleEnum.ADMIN)
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

  @Roles(RoleEnum.ADMIN)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-064: Update specialty' })
  update(@Param('id') id: string, @Body() dto: UpdateSpecialtyDto) {
    return this.specialtiesService.update(id, dto);
  }

  @Roles(RoleEnum.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'UC-065: Delete specialty' })
  remove(@Param('id') id: string) {
    return this.specialtiesService.remove(id);
  }
}
