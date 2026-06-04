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
    selfie: { originalname: 'selfie.jpg', buffer: Buffer.from('selfie') } as any,
  });

  it('submits a KYC request as pending review without running OCR inline', async () => {
    const { service, kycRepository, storage, ocr, auditLogs } = createService();
    kycRepository.findOne.mockResolvedValue(null);

    const result = await service.submitForCurrentUser(
      userId,
      validDto(),
      validFiles(),
    );

    expect(storage.save).toHaveBeenCalledTimes(3);
    expect(kycRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userId,
        id_type: 'CITIZEN_ID',
        id_number: '079123456789',
        verification_status: KycStatus.PENDING_REVIEW,
        ocr_status: KycOcrStatus.PENDING,
        ocr_attempts: 0,
        document_hash: 'idFront-hash',
        document_storage_consent_accepted_at: expect.any(Date),
        ocr_processing_consent_accepted_at: expect.any(Date),
        no_marketing_consent_accepted_at: expect.any(Date),
        processing_purpose: 'identity_verification_and_booking_safety',
        retention_policy_version: 'kyc-retention-v1',
        retention_expires_at: expect.any(Date),
      }),
    );
    expect(result.status).toBe(KycStatus.PENDING_REVIEW);
    expect(result.ocrStatus).toBe(KycOcrStatus.PENDING);
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

  it('approves pending KYC and marks booking eligibility true when phone is verified', async () => {
    const { service, kycRepository, accountRepository, auditLogs } = createService();
    kycRepository.findOne.mockResolvedValue({
      kyc_id: kycId,
      user_id: userId,
      id_type: 'CITIZEN_ID',
      id_number: '079123456789',
      verification_status: KycStatus.PENDING_REVIEW,
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
    expect(eligibility.canBook).toBe(false);
    expect(eligibility.kycStatus).toBe(KycStatus.REJECTED);
  });

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
