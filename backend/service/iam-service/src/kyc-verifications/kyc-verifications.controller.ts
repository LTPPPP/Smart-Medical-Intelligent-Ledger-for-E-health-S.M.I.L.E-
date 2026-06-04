import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Request,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorator';
import { RoleEnum } from '../auth/roles/roles.enum';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { ApproveKycDto, RejectKycDto } from './dto/review-kyc.dto';
import { QueryKycDto } from './dto/query-kyc.dto';
import { KycBookingEligibilityDto, KycResponseDto } from './dto/kyc-response.dto';
import { KycFileAccessAuditService } from './kyc-file-access-audit.service';
import { KycFileKind } from './kyc-file-storage.service';
import { KycVerificationsService } from './kyc-verifications.service';

@ApiTags('KYC')
@Controller({ path: 'kyc', version: '1' })
export class KycVerificationsController {
  constructor(
    private readonly kycService: KycVerificationsService,
    private readonly fileAccessAudit: KycFileAccessAuditService,
  ) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('me/submit')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['idType', 'idNumber', 'fullName', 'dateOfBirth', 'consentAccepted', 'idFront', 'idBack', 'selfie'],
      properties: {
        idType: { type: 'string', example: 'CITIZEN_ID' },
        idNumber: { type: 'string', example: '079123456789' },
        fullName: { type: 'string', example: 'Nguyen Van A' },
        dateOfBirth: { type: 'string', example: '1995-06-15' },
        consentAccepted: { type: 'string', example: 'true' },
        documentStorageConsentAccepted: { type: 'string', example: 'true' },
        ocrProcessingConsentAccepted: { type: 'string', example: 'true' },
        noMarketingConsentAccepted: { type: 'string', example: 'true' },
        consentVersion: { type: 'string', example: 'kyc-consent-v2' },
        retentionPolicyVersion: { type: 'string', example: 'kyc-retention-v1' },
        notes: { type: 'string' },
        idFront: { type: 'string', format: 'binary' },
        idBack: { type: 'string', format: 'binary' },
        selfie: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'idFront', maxCount: 1 },
      { name: 'idBack', maxCount: 1 },
      { name: 'selfie', maxCount: 1 },
    ]),
  )
  @ApiOkResponse({ type: KycResponseDto })
  submitMine(@Request() request, @Body() dto: SubmitKycDto, @UploadedFiles() files?: any) {
    return this.kycService.submitForCurrentUser(request.user.accountId, dto, {
      idFront: files?.idFront?.[0],
      idBack: files?.idBack?.[0],
      selfie: files?.selfie?.[0],
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiOkResponse({ type: KycResponseDto })
  findMine(@Request() request) {
    return this.kycService.findMine(request.user.accountId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('me/history')
  @ApiOkResponse({ type: KycResponseDto, isArray: true })
  findMineHistory(@Request() request) {
    return this.kycService.findMineHistory(request.user.accountId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST)
  @Get()
  findAll(@Query() query: QueryKycDto) {
    return this.kycService.findAll(query);
  }

  @Get('users/:userId/status')
  @ApiOkResponse({ type: KycBookingEligibilityDto })
  getBookingEligibility(
    @Param('userId') userId: string,
    @Headers('x-internal-api-key') apiKey?: string,
  ) {
    this.kycService.assertInternalApiKey(apiKey);
    return this.kycService.getBookingEligibility(userId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.kycService.findOneResponse(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Get(':id/files/:kind')
  async getFile(
    @Param('id') id: string,
    @Param('kind') kind: KycFileKind,
    @Request() request,
    @Res() response: Response,
  ) {
    await this.fileAccessAudit.logView({
      actorUserId: request.user.accountId,
      kycId: id,
      kind,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
    });
    const path = await this.kycService.getPrivateFilePath(id, kind);
    return response.sendFile(path, () => {
      void this.kycService.removeTemporaryFile(path);
    });
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST)
  @Post(':id/approve')
  @ApiOkResponse({ type: KycResponseDto })
  approve(@Param('id') id: string, @Request() request, @Body() dto: ApproveKycDto) {
    return this.kycService.approve(id, request.user.accountId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.RECEPTIONIST)
  @Post(':id/reject')
  @ApiOkResponse({ type: KycResponseDto })
  reject(@Param('id') id: string, @Request() request, @Body() dto: RejectKycDto) {
    return this.kycService.reject(id, request.user.accountId, dto);
  }

}
