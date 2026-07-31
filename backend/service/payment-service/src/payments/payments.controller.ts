import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { ApproveRefundDto } from './dto/approve-refund.dto';
import { RejectRefundDto } from './dto/reject-refund.dto';
import { JwtAuthGuard, RequestWithActor } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleEnum } from '../auth/roles.enum';
import { PaymentStatus } from './payment-status.enum';
import { RefundStatus } from './refund-status.enum';

@ApiTags('Payments')
@Controller({
  path: 'payments',
  version: '1',
})
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Payment is initiated by the patient themselves (online self-pay) or by
  // front-desk staff collecting at the counter — clinical roles handle no money.
  @Post('initiate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    RoleEnum.ADMIN,
    RoleEnum.MANAGER,
    RoleEnum.RECEPTIONIST,
    RoleEnum.PATIENT,
  )
  @ApiBearerAuth()
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
    @Req() req: RequestWithActor,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const { paymentUrl } = await this.paymentsService.initiate(
      dto,
      req.actor!,
      req.headers.authorization,
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
    @Query() rawQuery: Record<string, string>,
    @Query('vnp_ResponseCode') vnp_ResponseCode?: string,
    @Query('vnp_TxnRef') vnp_TxnRef?: string,
    @Query('vnp_TransactionNo') vnp_TransactionNo?: string,
  ) {
    const payment = await this.paymentsService.handleVnpayReturn(
      {
        vnp_ResponseCode,
        vnp_TxnRef,
        vnp_TransactionNo,
      },
      rawQuery,
    );
    return { data: payment };
  }

  @Get('appointment/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List payments for an appointment (history)' })
  @ApiParam({ name: 'id', description: 'Appointment UUID' })
  async findByAppointment(
    @Param('id') id: string,
    @Req() req: RequestWithActor,
  ) {
    const payments = await this.paymentsService.findByAppointment(
      id,
      req.actor!,
      req.headers.authorization,
    );
    return { data: payments };
  }

  // ── K4: Admin refund queue — declared before ':id' so it is not shadowed ──
  @Get('refunds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List refund requests (ADMIN, optional refund status filter)',
  })
  async listRefunds(
    @Query('status', new ParseEnumPipe(RefundStatus, { optional: true }))
    status?: RefundStatus,
  ) {
    const payments = await this.paymentsService.listRefunds(status);
    return { data: payments };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all payments (ADMIN, optional status filter)' })
  async findAll(
    @Query('status', new ParseEnumPipe(PaymentStatus, { optional: true }))
    status?: PaymentStatus,
  ) {
    const payments = await this.paymentsService.findAll(status);
    return { data: payments };
  }

  // ── K4: Open a refund request (authenticated patient/staff) ──────────────
  @Post(':id/refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a refund for a paid payment' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  async requestRefund(
    @Param('id') id: string,
    @Body() dto: RefundPaymentDto,
    @Req() req: RequestWithActor,
  ) {
    const payment = await this.paymentsService.requestRefund(
      id,
      dto,
      req.actor!,
      req.headers.authorization,
    );
    return { data: payment };
  }

  // ── K4: Approve a refund request (ADMIN) ─────────────────────────────────
  @Post(':id/refund/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a refund request and refund the payment' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  async approveRefund(
    @Param('id') id: string,
    @Body() dto: ApproveRefundDto,
    @Req() req: RequestWithActor,
  ) {
    const payment = await this.paymentsService.approveRefund(id, dto, req.actor!);
    return { data: payment };
  }

  // ── K4: Reject a refund request (ADMIN) ──────────────────────────────────
  @Post(':id/refund/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.MANAGER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a refund request' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  async rejectRefund(
    @Param('id') id: string,
    @Body() dto: RejectRefundDto,
    @Req() req: RequestWithActor,
  ) {
    const payment = await this.paymentsService.rejectRefund(id, dto, req.actor!);
    return { data: payment };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a single payment by ID' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  async findOne(@Param('id') id: string, @Req() req: RequestWithActor) {
    const payment = await this.paymentsService.findByIdForActor(
      id,
      req.actor!,
      req.headers.authorization,
    );
    return { data: payment };
  }
}
