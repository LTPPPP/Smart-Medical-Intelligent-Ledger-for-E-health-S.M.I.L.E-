import { KycOcrPollerService } from './kyc-ocr-poller.service';
import { KycOcrStatus, KycStatus } from './entities/kyc-verification.entity';
import { KycAutoVerificationService } from './kyc-auto-verification.service';

describe('KycOcrPollerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.KYC_OCR_ENABLED = 'true';
  });

  const createService = () => {
    const kycRepository = {
      find: jest.fn(),
      save: jest.fn(async (entity) => entity),
      update: jest.fn(async () => ({ affected: 0 })),
    };
    const fileStorage = {
      decryptToTempFile: jest.fn(async (path) => `/tmp/${path}`),
      removeTempFile: jest.fn(async () => undefined),
    };
    const ocrService = {
      extractIdentity: jest.fn(),
    };
    const assessmentService = {
      assess: jest.fn(() => ({
        riskLevel: 'LOW',
        riskReason: 'OCR completed and submitted identity data appears consistent.',
        checks: [{ code: 'OCR_COMPLETED', status: 'PASS' }],
      })),
    };
    const auditLogs = {
      create: jest.fn(async (dto) => dto),
    };
    const service = new KycOcrPollerService(
      kycRepository as any,
      fileStorage as any,
      ocrService as any,
      assessmentService as any,
      new KycAutoVerificationService(),
      auditLogs as any,
    );
    return {
      service,
      kycRepository,
      fileStorage,
      ocrService,
      assessmentService,
      auditLogs,
    };
  };

  const pendingKyc = () => ({
    kyc_id: 'kyc-1',
    user_id: 'user-1',
    id_number: '012345678901',
    full_name: 'KYC OCR Smoke',
    date_of_birth: '1990-01-01',
    id_front_image: 'front.png',
    id_back_image: 'back.png',
    verification_status: KycStatus.PENDING_REVIEW,
    ocr_status: KycOcrStatus.PENDING,
    ocr_attempts: 0,
    ocr_confidence: null,
    ocr_payload: null,
    ocr_last_error: null,
    ocr_processed_at: null,
  });

  it('processes pending OCR jobs and stores successful OCR output', async () => {
    const { service, kycRepository, fileStorage, ocrService, assessmentService } = createService();
    const entity = pendingKyc();
    kycRepository.find.mockResolvedValue([entity]);
    ocrService.extractIdentity.mockResolvedValue({
      status: KycOcrStatus.COMPLETED,
      confidence: 88,
      payload: { rawText: '012345678901', idNumber: '012345678901' },
    });

    await service.processPendingOnce();

    expect(kycRepository.save).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        ocr_status: KycOcrStatus.PROCESSING,
        ocr_attempts: 1,
      }),
    );
    expect(fileStorage.decryptToTempFile).toHaveBeenCalledWith('front.png');
    expect(fileStorage.decryptToTempFile).toHaveBeenCalledWith('back.png');
    expect(ocrService.extractIdentity).toHaveBeenCalledWith({
      idFrontPath: '/tmp/front.png',
      idBackPath: '/tmp/back.png',
      expectedIdNumber: '012345678901',
      expectedDateOfBirth: '1990-01-01',
    });
    expect(fileStorage.removeTempFile).toHaveBeenCalledWith('/tmp/front.png');
    expect(fileStorage.removeTempFile).toHaveBeenCalledWith('/tmp/back.png');
    expect(kycRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ocr_status: KycOcrStatus.COMPLETED,
        ocr_confidence: 88,
        ocr_payload: {
          rawText: '012345678901',
          idNumber: '012345678901',
          checks: [{ code: 'OCR_COMPLETED', status: 'PASS' }],
          riskLevel: 'LOW',
          riskReason: 'OCR completed and submitted identity data appears consistent.',
        },
        ocr_last_error: null,
      }),
    );
    expect(assessmentService.assess).toHaveBeenCalledWith({
      submitted: {
        idNumber: '012345678901',
        fullName: 'KYC OCR Smoke',
        dateOfBirth: '1990-01-01',
      },
      ocr: {
        status: KycOcrStatus.COMPLETED,
        confidence: 88,
        payload: { rawText: '012345678901', idNumber: '012345678901' },
      },
    });
  });

  it('automatically verifies a pending submission when every OCR criterion passes', async () => {
    const { service, kycRepository, ocrService, auditLogs } = createService();
    const entity = pendingKyc();
    kycRepository.find.mockResolvedValue([entity]);
    ocrService.extractIdentity.mockResolvedValue({
      status: KycOcrStatus.COMPLETED,
      confidence: 91,
      payload: {
        documentType: 'CITIZEN_ID',
        idNumber: '012345678901',
        fullName: 'KYC OCR SMOKE',
        dateOfBirth: '1990-01-01',
        riskLevel: 'LOW',
        front: { side: 'FRONT' },
        back: { side: 'BACK' },
      },
    });

    await service.processPendingOnce();

    expect(kycRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        verification_status: KycStatus.VERIFIED,
        verified_at: expect.any(Date),
        verified_by: null,
        decision_source: 'AUTO',
        decision_reason: 'All automatic verification checks passed.',
      }),
    );
    expect(auditLogs.create).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'KYC_AUTO_VERIFIED',
        resource_id: 'kyc-1',
      }),
    );
  });

  it('returns failed OCR jobs to pending while retry attempts remain', async () => {
    const { service, kycRepository, fileStorage, ocrService } = createService();
    const entity = pendingKyc();
    const rawError = 'sentinel-patient@example.test could not be read from private storage';
    const warn = jest.spyOn((service as any).logger, 'warn').mockImplementation();
    kycRepository.find.mockResolvedValue([entity]);
    ocrService.extractIdentity.mockRejectedValue(new Error(rawError));

    await expect(service.processPendingOnce()).resolves.toBeUndefined();

    const storedError = 'error_class=Error error_code=unknown';
    expect(kycRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ocr_status: KycOcrStatus.PENDING,
        ocr_confidence: null,
        ocr_last_error: storedError,
        ocr_payload: { error: storedError },
        ocr_processed_at: null,
      }),
    );
    expect(warn).toHaveBeenCalledWith('operation=kyc_ocr outcome=failed error_class=Error error_code=unknown');
    expect(JSON.stringify(warn.mock.calls)).not.toContain(rawError);
    expect(JSON.stringify(warn.mock.calls)).not.toContain(entity.kyc_id);
    expect(JSON.stringify(kycRepository.save.mock.calls)).not.toContain(rawError);
    expect(fileStorage.removeTempFile).toHaveBeenCalledWith('/tmp/front.png');
    expect(fileStorage.removeTempFile).toHaveBeenCalledWith('/tmp/back.png');
  });

  it('marks failed OCR jobs terminal after the maximum attempt', async () => {
    const { service, kycRepository, ocrService } = createService();
    const entity = { ...pendingKyc(), ocr_attempts: 2 };
    kycRepository.find.mockResolvedValue([entity]);
    ocrService.extractIdentity.mockRejectedValue(new Error('Unreadable image'));

    await service.processPendingOnce();

    expect(kycRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ocr_status: KycOcrStatus.FAILED,
        ocr_attempts: 3,
        ocr_last_error: 'error_class=Error error_code=unknown',
        ocr_payload: {
          error: 'error_class=Error error_code=unknown',
        },
        ocr_processed_at: expect.any(Date),
      }),
    );
  });

  it('sanitizes provider failure payloads that resolve instead of throwing', async () => {
    const { service, kycRepository, ocrService } = createService();
    const entity = pendingKyc();
    const rawError = 'sentinel-patient@example.test private OCR upstream response';
    kycRepository.find.mockResolvedValue([entity]);
    ocrService.extractIdentity.mockResolvedValue({
      status: KycOcrStatus.FAILED,
      confidence: null,
      payload: { error: rawError },
    });

    await service.processPendingOnce();

    expect(kycRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ocr_status: KycOcrStatus.PENDING,
        ocr_last_error: 'error_class=OcrProviderError error_code=unknown',
        ocr_payload: expect.objectContaining({
          error: 'error_class=OcrProviderError error_code=unknown',
        }),
      }),
    );
    expect(JSON.stringify(kycRepository.save.mock.calls)).not.toContain(rawError);
  });

  it('returns stale processing jobs to pending before polling', async () => {
    const { service, kycRepository } = createService();
    kycRepository.find.mockResolvedValue([]);
    process.env.KYC_OCR_STALE_PROCESSING_MS = '60000';

    await service.processPendingOnce();

    expect(kycRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        verification_status: KycStatus.PENDING_REVIEW,
        ocr_status: KycOcrStatus.PROCESSING,
        updated_at: expect.anything(),
      }),
      expect.objectContaining({
        ocr_status: KycOcrStatus.PENDING,
        ocr_last_error: expect.stringContaining('stale'),
      }),
    );
  });

  it('preserves a higher PaddleOCR risk level from card preprocessing checks', async () => {
    const { service, kycRepository, ocrService } = createService();
    const entity = pendingKyc();
    kycRepository.find.mockResolvedValue([entity]);
    ocrService.extractIdentity.mockResolvedValue({
      status: KycOcrStatus.COMPLETED,
      confidence: 90,
      payload: {
        rawText: '012345678901',
        idNumber: '012345678901',
        riskLevel: 'HIGH',
        automatedChecks: [
          {
            code: 'FRONT_CARD_DETECTED',
            status: 'FAIL',
            message: 'Could not detect a card-shaped document region.',
          },
        ],
      },
    });

    await service.processPendingOnce();

    expect(kycRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ocr_payload: expect.objectContaining({
          riskLevel: 'HIGH',
          riskReason: 'Could not detect a card-shaped document region.',
        }),
      }),
    );
  });

  it('does not process when OCR is disabled', async () => {
    const { service, kycRepository, ocrService } = createService();
    process.env.KYC_OCR_ENABLED = 'false';

    await service.processPendingOnce();

    expect(kycRepository.find).not.toHaveBeenCalled();
    expect(ocrService.extractIdentity).not.toHaveBeenCalled();
  });
});
