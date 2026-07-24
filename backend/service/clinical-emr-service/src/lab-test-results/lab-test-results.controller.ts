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
import { LabTestResultsService } from './lab-test-results.service';
import { CreateLabTestResultDto } from './dto/create-lab-test-result.dto';
import { UpdateLabTestResultDto } from './dto/update-lab-test-result.dto';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles/roles.guard';

// Staff/clinician-only — patient PHI; a PATIENT must not reach these endpoints.
@ApiTags('Lab Results')
@Controller('lab-test-results')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DOCTOR)
export class LabTestResultsController {
  constructor(private readonly labTestResultsService: LabTestResultsService) {}

  @Post()
  create(@Body() createLabTestResultDto: CreateLabTestResultDto) {
    return this.labTestResultsService.create(createLabTestResultDto);
  }

  @Get()
  findAll() {
    return this.labTestResultsService.findAll();
  }

  @Get('abnormal')
  findAbnormalResults() {
    return this.labTestResultsService.findAbnormalResults();
  }

  @Get(':result_id')
  findOne(@Param('result_id', ParseUUIDPipe) result_id: string) {
    return this.labTestResultsService.findOne(result_id);
  }

  @Get('order/:order_id')
  findByOrderId(@Param('order_id', ParseUUIDPipe) order_id: string) {
    return this.labTestResultsService.findByOrderId(order_id);
  }

  @Patch(':result_id')
  update(
    @Param('result_id', ParseUUIDPipe) result_id: string,
    @Body() updateLabTestResultDto: UpdateLabTestResultDto,
  ) {
    return this.labTestResultsService.update(result_id, updateLabTestResultDto);
  }

  @Delete(':result_id')
  remove(@Param('result_id', ParseUUIDPipe) result_id: string) {
    return this.labTestResultsService.remove(result_id);
  }
}
