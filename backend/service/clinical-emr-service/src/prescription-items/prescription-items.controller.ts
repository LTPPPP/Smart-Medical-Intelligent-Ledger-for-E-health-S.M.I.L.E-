import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrescriptionItemsService } from './prescription-items.service';
import { CreatePrescriptionItemDto } from './dto/create-prescription-item.dto';
import { UpdatePrescriptionItemDto } from './dto/update-prescription-item.dto';

@ApiTags('Prescriptions')
@Controller('prescription-items')
export class PrescriptionItemsController {
  constructor(
    private readonly prescriptionItemsService: PrescriptionItemsService,
  ) {}

  @Post()
  create(@Body() createPrescriptionItemDto: CreatePrescriptionItemDto) {
    return this.prescriptionItemsService.create(createPrescriptionItemDto);
  }

  @Get()
  findAll() {
    return this.prescriptionItemsService.findAll();
  }

  @Get('prescription/:prescription_id')
  findByPrescriptionId(
    @Param('prescription_id', ParseUUIDPipe) prescription_id: string,
  ) {
    return this.prescriptionItemsService.findByPrescriptionId(prescription_id);
  }

  @Get(':item_id')
  findOne(@Param('item_id', ParseUUIDPipe) item_id: string) {
    return this.prescriptionItemsService.findOne(item_id);
  }

  @Patch(':item_id')
  update(
    @Param('item_id', ParseUUIDPipe) item_id: string,
    @Body() updatePrescriptionItemDto: UpdatePrescriptionItemDto,
  ) {
    return this.prescriptionItemsService.update(
      item_id,
      updatePrescriptionItemDto,
    );
  }

  @Delete(':item_id')
  remove(@Param('item_id', ParseUUIDPipe) item_id: string) {
    return this.prescriptionItemsService.remove(item_id);
  }
}
