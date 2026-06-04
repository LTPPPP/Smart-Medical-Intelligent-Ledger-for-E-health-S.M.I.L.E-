import { KycOcrPollerService } from './kyc-ocr-poller.service';
import { KycOcrStatus, KycStatus } from './entities/kyc-verification.entity';

describe('KycOcrPollerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.KYC_OCR_ENABLED = 'true';
  });

  const createService = () => {
    const kycRepository = {
      find: jest.fn(),
      save: jest.fn(async (entity) => entity),
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
    const service = new KycOcrPollerService(
      kycRepository as any,
      fileStorage as any,
      ocrService as any,
      assessmentService as any,
    );
    return { service, kycRepository, fileStorage, ocrService, assessmentService };
  };

  const pendingKyc = () => ({
    kyc_id: 'kyc-1',
    user_id: 'user-1',
    id_number: '012345678901',
    full_name: 'KYC OCR Smoke',
    date_of_birth: '1990-01-01',
    id_front_image: 'front.png',
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
    expect(ocrService.extractIdentity).toHaveBeenCalledWith('/tmp/front.png');
    expect(fileStorage.removeTempFile).toHaveBeenCalledWith('/tmp/front.png');
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

  it('marks failed OCR jobs without throwing', async () => {
    const { service, kycRepository, fileStorage, ocrService } = createService();
    const entity = pendingKyc();
    kycRepository.find.mockResolvedValue([entity]);
    ocrService.extractIdentity.mockRejectedValue(new Error('Error attempting to read image.'));

    await expect(service.processPendingOnce()).resolves.toBeUndefined();

    expect(kycRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ocr_status: KycOcrStatus.FAILED,
        ocr_confidence: null,
        ocr_last_error: 'Error attempting to read image.',
        ocr_payload: { error: 'Error attempting to read image.' },
      }),
    );
    expect(fileStorage.removeTempFile).toHaveBeenCalledWith('/tmp/front.png');
  });

  it('does not process when OCR is disabled', async () => {
    const { service, kycRepository, ocrService } = createService();
    process.env.KYC_OCR_ENABLED = 'false';

    await service.processPendingOnce();

    expect(kycRepository.find).not.toHaveBeenCalled();
    expect(ocrService.extractIdentity).not.toHaveBeenCalled();
  });
});
