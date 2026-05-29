import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { CreateReferralDto } from './dto/create-referral.dto';
import { ReferralStatus } from './entities/referral.entity';

@ApiTags('Referrals')
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly service: ReferralsService) {}

  @Post()
  create(@Body() dto: CreateReferralDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':referral_id')
  findOne(@Param('referral_id', ParseUUIDPipe) referral_id: string) {
    return this.service.findOne(referral_id);
  }

  @Get('session/:session_id')
  findBySessionId(@Param('session_id', ParseUUIDPipe) session_id: string) {
    return this.service.findBySessionId(session_id);
  }

  @Get('patient/:patient_id')
  findByPatientId(@Param('patient_id', ParseUUIDPipe) patient_id: string) {
    return this.service.findByPatientId(patient_id);
  }

  /** Cập nhật trạng thái giấy chuyển viện */
  @Patch(':referral_id/status')
  updateStatus(
    @Param('referral_id', ParseUUIDPipe) referral_id: string,
    @Body('status') status: ReferralStatus,
    @Body('accepted_by') accepted_by?: string,
  ) {
    return this.service.updateStatus(referral_id, status, accepted_by);
  }

  @Patch(':referral_id/cancel')
  cancel(@Param('referral_id', ParseUUIDPipe) referral_id: string) {
    return this.service.cancel(referral_id);
  }
}
