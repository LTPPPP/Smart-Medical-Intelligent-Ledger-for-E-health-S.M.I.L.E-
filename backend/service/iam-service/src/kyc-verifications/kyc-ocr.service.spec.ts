import { KycOcrStatus } from './entities/kyc-verification.entity';
import { KycOcrService } from './kyc-ocr.service';

const terminate = jest.fn();
const recognize = jest.fn();
const createWorker = jest.fn();

jest.mock('tesseract.js', () => ({
  createWorker,
}));

describe('KycOcrService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.KYC_OCR_ENABLED = 'true';
    process.env.KYC_OCR_TIMEOUT_MS = '1000';
  });

  it('terminates the worker and returns failed OCR when recognition rejects', async () => {
    terminate.mockResolvedValue(undefined);
    createWorker.mockResolvedValue({ recognize, terminate });
    recognize.mockRejectedValue(new Error('Error attempting to read image.'));
    const service = new KycOcrService();

    const result = await service.extractIdentity('/tmp/bad.png');

    expect(createWorker).toHaveBeenCalledWith(
      'vie+eng',
      undefined,
      expect.objectContaining({ errorHandler: expect.any(Function) }),
    );
    expect(terminate).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      status: KycOcrStatus.FAILED,
      confidence: null,
      payload: { error: 'Error attempting to read image.' },
    });
  });

  it('returns failed OCR when recognition times out', async () => {
    terminate.mockResolvedValue(undefined);
    createWorker.mockResolvedValue({
      recognize: jest.fn(() => new Promise(() => undefined)),
      terminate,
    });
    process.env.KYC_OCR_TIMEOUT_MS = '1';
    const service = new KycOcrService();

    const result = await service.extractIdentity('/tmp/slow.png');

    expect(terminate).toHaveBeenCalledTimes(1);
    expect(result.status).toBe(KycOcrStatus.FAILED);
    expect(result.payload.error).toContain('timed out');
  });
});
