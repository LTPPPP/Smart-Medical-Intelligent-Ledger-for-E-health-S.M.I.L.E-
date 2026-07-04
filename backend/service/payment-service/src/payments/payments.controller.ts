import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';

@ApiTags('Payments')
@Controller({
  path: 'payments',
  version: '1',
})
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Initiate a payment and return a (mock) VNPay payment URL',
  })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description:
      'Client-generated key; retries with the same key return the original payment instead of creating a duplicate',
  })
  async initiate(
    @Body() dto: InitiatePaymentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const { paymentUrl } = await this.paymentsService.initiate(
      dto,
      idempotencyKey,
    );
    return { data: { paymentUrl } };
  }

  @Get('vnpay-return')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'VNPay return/callback handler — marks payment paid on code 00',
  })
  async vnpayReturn(
    @Query('vnp_ResponseCode') vnp_ResponseCode?: string,
    @Query('vnp_TxnRef') vnp_TxnRef?: string,
    @Query('vnp_TransactionNo') vnp_TransactionNo?: string,
  ) {
    const payment = await this.paymentsService.handleVnpayReturn({
      vnp_ResponseCode,
      vnp_TxnRef,
      vnp_TransactionNo,
    });
    return { data: payment };
  }

  @Get('appointment/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List payments for an appointment (history)' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  async findByAppointment(@Param('id') id: string) {
    const payments = await this.paymentsService.findByAppointment(id);
    return { data: payments };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all payments (optional status filter)' })
  async findAll(@Query('status') status?: string) {
    const payments = await this.paymentsService.findAll(status);
    return { data: payments };
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refund a payment' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  async refund(@Param('id') id: string, @Body() dto: RefundPaymentDto) {
    const payment = await this.paymentsService.refund(id, dto);
    return { data: payment };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  async findOne(@Param('id') id: string) {
    const payment = await this.paymentsService.findById(id);
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return { data: payment };
  }
}
