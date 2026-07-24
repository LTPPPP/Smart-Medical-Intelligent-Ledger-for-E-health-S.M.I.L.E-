import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RecordExportsService } from './record-exports.service';
import { CreateRecordExportDto } from './dto/create-record-export.dto';
import { UpdateRecordExportDto } from './dto/update-record-export.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

@ApiTags('Medical Records')
@Controller('record-exports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR)
export class RecordExportsController {
  constructor(private readonly recordExportsService: RecordExportsService) {}

  @Post()
  create(@Body() createRecordExportDto: CreateRecordExportDto) {
    return this.recordExportsService.create(createRecordExportDto);
  }

  @Get()
  findAll() {
    return this.recordExportsService.findAll();
  }

  @Get(':export_id')
  findOne(@Param('export_id', ParseUUIDPipe) export_id: string) {
    return this.recordExportsService.findOne(export_id);
  }

  @Get('record/:record_id')
  findByRecordId(@Param('record_id', ParseUUIDPipe) record_id: string) {
    return this.recordExportsService.findByRecordId(record_id);
  }

  @Patch(':export_id')
  update(
    @Param('export_id', ParseUUIDPipe) export_id: string,
    @Body() updateRecordExportDto: UpdateRecordExportDto,
  ) {
    return this.recordExportsService.update(export_id, updateRecordExportDto);
  }

  @Delete(':export_id')
  remove(@Param('export_id', ParseUUIDPipe) export_id: string) {
    return this.recordExportsService.remove(export_id);
  }
}
