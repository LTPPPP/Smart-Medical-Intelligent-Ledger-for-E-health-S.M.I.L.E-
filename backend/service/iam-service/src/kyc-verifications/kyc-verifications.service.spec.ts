import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { KycVerificationsService } from './kyc-verifications.service';
import { KycOcrStatus, KycStatus } from './entities/kyc-verification.entity';

const createRepository = () => ({
  create: jest.fn((value) => value),
  save: jest.fn(async (value) => value),
  findOne: jest.fn(),
  find: jest.fn(),
  findAndCount: jest.fn(),
});

describe('KycVerificationsService', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const kycId = '660e8400-e29b-41d4-a716-446655440000';

  const createService = () => {
    const kycRepository = createRepository();
    const accountRepository = createRepository();
    const storage = {
      save: jest.fn(async (file, context) => ({
        path: `storage/kyc/${context.userId}/${context.kycId}/${context.kind}.jpg`,
        sha256: `${context.kind}-hash`,
      })),
      resolvePrivatePath: jest.fn((path) => path),
      decryptToTempFile: jest.fn(async (path) => `/tmp/${path}`),
      removeTempFile: jest.fn(async () => undefined),
    };
    const ocr = {
      extractIdentity: jest.fn(async () => ({
        status: 'COMPLETED',
        confidence: 83,
        payload: {
          idNumber: '079123456789',
          fullName: 'NGUYEN VAN A',
          dateOfBirth: '1995-06-15',
          rawText: '079123456789 NGUYEN VAN A 15/06/1995',
        },
      })),
    };
    const auditLogs = { create: jest.fn(async (dto) => dto) };
    const service = new KycVerificationsService(
      kycRepository as any,
      accountRepository as any,
      storage as any,
      ocr as any,
      auditLogs as any,
    );
    return { service, kycRepository, accountRepository, storage, ocr, auditLogs };
  };

  const validDto = () => ({
    idType: 'CITIZEN_ID',
    idNumber: '079123456789',
    fullName: 'Nguyen Van A',
    dateOfBirth: '1995-06-15',
    consentAccepted: 'true',
    documentStorageConsentAccepted: 'true',
    ocrProcessingConsentAccepted: 'true',
    noMarketingConsentAccepted: 'true',
    consentVersion: 'kyc-consent-v2',
    retentionPolicyVersion: 'kyc-retention-v1',
  });

  const validFiles = () => ({
    idFront: { originalname: 'front.jpg', buffer: Buffer.from('front') } as any,
    idBack: { originalname: 'back.jpg', buffer: Buffer.from('back') } as any,
  });

  it('submits front and back citizen ID images without requiring a selfie', async () => {
    const { service, kycRepository, storage, ocr, auditLogs } = createService();
    kycRepository.findOne.mockResolvedValue(null);

    const result = await service.submitForCurrentUser(
      userId,
      validDto(),
      validFiles(),
    );

    expect(storage.save).toHaveBeenCalledTimes(2);
    expect(kycRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        id_type: 'CITIZEN_ID',
        id_number: '079123456789',
        verification_status: KycStatus.PENDING_REVIEW,
        ocr_status: KycOcrStatus.SKIPPED,
        ocr_attempts: 0,
        document_hash: 'idFront-hash',
        selfie_image: null,
        document_storage_consent_accepted_at: expect.any(Date),
        ocr_processing_consent_accepted_at: expect.any(Date),
        no_marketing_consent_accepted_at: expect.any(Date),
        processing_purpose: 'identity_verification_and_booking_safety',
        retention_policy_version: 'kyc-retention-v1',
        retention_expires_at: expect.any(Date),
      }),
    );
    expect(result.status).toBe(KycStatus.PENDING_REVIEW);
    expect(result.ocrStatus).toBe(KycOcrStatus.SKIPPED);
    expect(result.idNumberMasked).toBe('********6789');
    expect(ocr.extractIdentity).not.toHaveBeenCalled();
    expect(auditLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        action: 'KYC_SUBMITTED',
        resource: 'kyc',
      }),
    );
  });

  it('rejects KYC when document storage consent is not accepted', async () => {
    const { service, kycRepository } = createService();
    kycRepository.findOne.mockResolvedValue(null);

    await expect(
      service.submitForCurrentUser(
        userId,
        {
          ...validDto(),
          documentStorageConsentAccepted: 'false',
        },
        validFiles(),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects unsupported document types even when DTO validation is bypassed', async () => {
    const { service, kycRepository, storage } = createService();
    kycRepository.findOne.mockResolvedValue(null);

    await expect(
      service.submitForCurrentUser(
        userId,
        { ...validDto(), idType: 'PASSPORT' },
        validFiles(),
      ),
    ).rejects.toThrow('Only Vietnamese citizen ID cards are supported');
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('rejects missing front images with a safe field-specific message', async () => {
    const { service, kycRepository } = createService();
    kycRepository.findOne.mockResolvedValue(null);

    await expect(
      service.submitForCurrentUser(userId, validDto(), {
        ...validFiles(),
        idFront: undefined,
      }),
    ).rejects.toThrow(
      "We couldn't read the front of your citizen ID. Upload a clearer image with all four corners visible.",
    );
  });

  it('redacts raw OCR payload and infrastructure errors from patient status', async () => {
    const { service, kycRepository } = createService();
    kycRepository.findOne.mockResolvedValue({
      kyc_id: kycId,
      user_id: userId,
      id_type: 'CITIZEN_ID',
      id_number: '079123456789',
      verification_status: KycStatus.PENDING_REVIEW,
      ocr_status: KycOcrStatus.FAILED,
      ocr_payload: {
        rawText: 'private OCR text',
        error: 'connect ECONNREFUSED 172.18.0.6:8010',
      },
      ocr_last_error: 'connect ECONNREFUSED 172.18.0.6:8010',
      decision_reason: null,
    });

    const response = await service.findMine(userId);

    expect(response.ocrPayload).toBeUndefined();
    expect(response.ocrLastError).toBeUndefined();
    expect(JSON.stringify(response)).not.toContain('ECONNREFUSED');
    expect(response.statusMessage).toBe(
      "We couldn't complete automatic document reading. Your submission is safe and has been sent for manual review.",
    );
  });

  it('treats legacy terminal records without decision metadata as manual decisions', async () => {
    const { service, kycRepository } = createService();
    kycRepository.findOne.mockResolvedValue({
      kyc_id: kycId,
      user_id: userId,
      id_type: 'CITIZEN_ID',
      id_number: '079123456789',
      verification_status: KycStatus.REJECTED,
      ocr_status: KycOcrStatus.COMPLETED,
      decision_source: null,
      decision_reason: null,
      rejection_reason: 'Legacy rejection',
    });

    const response = await service.findOneResponse(kycId);

    expect(response.decisionSource).toBe('MANUAL');
    expect(response.decisionReason).toBe('Legacy rejection');
  });

  it('approves pending KYC and marks booking eligibility true when phone is verified', async () => {
    const { service, kycRepository, accountRepository, auditLogs } = createService();
    kycRepository.findOne.mockResolvedValue({
      kyc_id: kycId,
      user_id: userId,
      id_type: 'CITIZEN_ID',
      id_number: '079123456789',
      verification_status: KycStatus.PENDING_REVIEW,
      ocr_status: KycOcrStatus.COMPLETED,
    });
    accountRepository.findOne.mockResolvedValue({ accountId: userId, phoneVerified: true });

    const approved = await service.approve(kycId, 'admin-id', { adminNotes: 'Looks good' });
    const eligibility = await service.getBookingEligibility(userId);

    expect(approved.status).toBe(KycStatus.VERIFIED);
    expect(kycRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        verification_status: KycStatus.VERIFIED,
        verified_by: 'admin-id',
        admin_notes: 'Looks good',
        decision_source: 'MANUAL',
      }),
    );
    expect(eligibility).toEqual({
      userId,
      phoneVerified: true,
      kycStatus: KycStatus.VERIFIED,
      canBook: true,
    });
    expect(auditLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'KYC_APPROVED', resource_id: kycId }),
    );
  });

  it('blocks approval when OCR assessment marks KYC as high risk', async () => {
    const { service, kycRepository } = createService();
    kycRepository.findOne.mockResolvedValue({
      kyc_id: kycId,
      user_id: userId,
      id_type: 'CITIZEN_ID',
      id_number: '079123456789',
      verification_status: KycStatus.PENDING_REVIEW,
      ocr_status: KycOcrStatus.COMPLETED,
      ocr_payload: {
        riskLevel: 'HIGH',
        riskReason: 'One or more required identity checks failed.',
      },
    });

    await expect(service.approve(kycId, 'admin-id', {})).rejects.toThrow(
      BadRequestException,
    );
    expect(kycRepository.save).not.toHaveBeenCalled();
  });

  it('rejects KYC with a required reason and keeps booking disabled', async () => {
    const { service, kycRepository, accountRepository } = createService();
    kycRepository.findOne.mockResolvedValue({
      kyc_id: kycId,
      user_id: userId,
      id_number: '079123456789',
      verification_status: KycStatus.PENDING_REVIEW,
    });
    accountRepository.findOne.mockResolvedValue({ accountId: userId, phoneVerified: true });

    const rejected = await service.reject(kycId, 'admin-id', {
      rejectionReason: 'Image is blurry',
    });
    const eligibility = await service.getBookingEligibility(userId);

    expect(rejected.status).toBe(KycStatus.REJECTED);
    expect(rejected.decisionSource).toBe('MANUAL');
    expect(eligibility.canBook).toBe(false);
    expect(eligibility.kycStatus).toBe(KycStatus.REJECTED);
  });

  it.each([KycStatus.VERIFIED, KycStatus.REJECTED])(
    'blocks approval when KYC is already %s',
    async (status) => {
      const { service, kycRepository } = createService();
      kycRepository.findOne.mockResolvedValue({
        kyc_id: kycId,
        user_id: userId,
        verification_status: status,
        ocr_status: KycOcrStatus.COMPLETED,
      });

      await expect(service.approve(kycId, 'admin-id', {})).rejects.toThrow(
        BadRequestException,
      );
      expect(kycRepository.save).not.toHaveBeenCalled();
    },
  );

  it.each([KycStatus.VERIFIED, KycStatus.REJECTED])(
    'blocks rejection when KYC is already %s',
    async (status) => {
      const { service, kycRepository } = createService();
      kycRepository.findOne.mockResolvedValue({
        kyc_id: kycId,
        user_id: userId,
        verification_status: status,
      });

      await expect(
        service.reject(kycId, 'admin-id', { rejectionReason: 'Invalid' }),
      ).rejects.toThrow(BadRequestException);
      expect(kycRepository.save).not.toHaveBeenCalled();
    },
  );

  it.each([KycOcrStatus.PENDING, KycOcrStatus.PROCESSING])(
    'blocks approval while OCR is %s',
    async (ocrStatus) => {
      const { service, kycRepository } = createService();
      kycRepository.findOne.mockResolvedValue({
        kyc_id: kycId,
        user_id: userId,
        verification_status: KycStatus.PENDING_REVIEW,
        ocr_status: ocrStatus,
      });

      await expect(service.approve(kycId, 'admin-id', {})).rejects.toThrow(
        BadRequestException,
      );
      expect(kycRepository.save).not.toHaveBeenCalled();
    },
  );

  it('throws when approving a missing KYC request', async () => {
    const { service, kycRepository } = createService();
    kycRepository.findOne.mockResolvedValue(null);

    await expect(service.approve(kycId, 'admin-id', {})).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws forbidden when internal booking status key is invalid', async () => {
    const { service } = createService();

    expect(() => service.assertInternalApiKey('wrong-key')).toThrow(
      ForbiddenException,
    );
  });
});
