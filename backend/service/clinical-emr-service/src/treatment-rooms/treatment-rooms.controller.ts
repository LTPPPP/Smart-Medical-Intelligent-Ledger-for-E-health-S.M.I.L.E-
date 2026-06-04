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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TreatmentRoomsService } from './treatment-rooms.service';
import { CreateTreatmentRoomDto } from './dto/create-treatment-room.dto';
import { UpdateTreatmentRoomDto } from './dto/update-treatment-room.dto';
import { QueryTreatmentRoomDto } from './dto/query-treatment-room.dto';

@ApiTags('Treatment Rooms')
@Controller({ version: '1' })
export class TreatmentRoomsController {
  constructor(private readonly treatmentRoomsService: TreatmentRoomsService) {}

  @Post('clinics/:clinicId/treatment-rooms')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'UC-026: Add treatment room to clinic' })
  @ApiResponse({ status: 201, description: 'Treatment room created' })
  create(
    @Param('clinicId') clinicId: string,
    @Body() dto: CreateTreatmentRoomDto,
  ) {
    return this.treatmentRoomsService.create(clinicId, dto);
  }

  @Get('clinics/:clinicId/treatment-rooms')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-027: List treatment rooms by clinic' })
  @ApiResponse({ status: 200, description: 'List of treatment rooms' })
  async findAllByClinic(
    @Param('clinicId') clinicId: string,
    @Query() query: QueryTreatmentRoomDto,
  ) {
    const result = await this.treatmentRoomsService.findAllByClinic(
      clinicId,
      query,
    );
    return {
      data: result.data,
      meta: {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        total: result.total,
      },
    };
  }

  @Get('treatment-rooms/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-027: Get treatment room detail' })
  findOne(@Param('id') id: string) {
    return this.treatmentRoomsService.findById(id);
  }

  @Patch('treatment-rooms/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'UC-028: Update treatment room' })
  update(@Param('id') id: string, @Body() dto: UpdateTreatmentRoomDto) {
    return this.treatmentRoomsService.update(id, dto);
  }

  @Delete('treatment-rooms/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'UC-029: Delete treatment room' })
  remove(@Param('id') id: string) {
    return this.treatmentRoomsService.remove(id);
  }
}
