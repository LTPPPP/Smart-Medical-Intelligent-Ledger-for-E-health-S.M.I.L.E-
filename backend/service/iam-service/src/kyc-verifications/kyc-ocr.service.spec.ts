import axios from 'axios';
import { KycOcrStatus } from './entities/kyc-verification.entity';
import { KycOcrService } from './kyc-ocr.service';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('KycOcrService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.KYC_OCR_ENABLED = 'true';
    process.env.KYC_PADDLE_OCR_URL = 'http://kyc-ocr-service:8010';
    process.env.KYC_OCR_TIMEOUT_MS = '1000';
  });

  it('returns skipped OCR when disabled', async () => {
    process.env.KYC_OCR_ENABLED = 'false';
    const service = new KycOcrService();

    const result = await service.extractIdentity({
      idFrontPath: '/tmp/front.jpg',
      idBackPath: '/tmp/back.jpg',
      expectedIdNumber: '087204009012',
      expectedDateOfBirth: '2004-10-08',
    });

    expect(mockedAxios.post).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: KycOcrStatus.SKIPPED,
      confidence: null,
      payload: {
        skipped: true,
        reason: 'OCR is disabled',
      },
    });
  });

  it('posts front and back images to PaddleOCR and normalizes the response', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        engine: 'paddleocr',
        front: {
          fields: {
            id_number: '087204009012',
            full_name: 'TRAN DAI NHAN',
            date_of_birth: '2004-10-08',
          },
          raw_text: 'So 087204009012 Ho va ten TRAN DAI NHAN Ngay sinh 08/10/2004',
          risk_level: 'LOW',
          lines: [{ confidence: 0.91 }, { confidence: 0.89 }],
          checks: {
            ID_NUMBER_FOUND: { status: 'PASS', message: 'Found ID' },
          },
        },
        back: {
          fields: {
            id_number: '087204009012',
            issue_date: '2021-11-22',
          },
          raw_text: 'IDVNM2040090122087204009012<3',
          risk_level: 'LOW',
          lines: [{ confidence: 0.95 }],
          checks: {
            BACK_SIDE_HINT: { status: 'PASS', message: 'Looks like back' },
          },
        },
        checks: {
          FRONT_BACK_ID_MATCH: { status: 'PASS', message: 'Front/back ID match' },
          SUBMITTED_DOB_MATCH: { status: 'PASS', message: 'DOB match' },
        },
        risk_level: 'LOW',
      },
    });
    const service = new KycOcrService();

    const result = await service.extractIdentity({
      idFrontPath: __filename,
      idBackPath: __filename,
      expectedIdNumber: '087204009012',
      expectedDateOfBirth: '2004-10-08',
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://kyc-ocr-service:8010/v1/ocr/cccd',
      expect.anything(),
      expect.objectContaining({
        headers: expect.any(Object),
        timeout: 1000,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        status: KycOcrStatus.COMPLETED,
        confidence: 92,
        payload: expect.objectContaining({
          provider: 'paddleocr',
          rawText: expect.stringContaining('087204009012'),
          idNumber: '087204009012',
          fullName: 'TRAN DAI NHAN',
          dateOfBirth: '2004-10-08',
          issueDate: '2021-11-22',
          riskLevel: 'LOW',
          automatedChecks: expect.arrayContaining([
            expect.objectContaining({ code: 'FRONT_BACK_ID_MATCH', status: 'PASS' }),
          ]),
        }),
      }),
    );
  });

  it('returns failed OCR when PaddleOCR rejects', async () => {
    mockedAxios.post.mockRejectedValue(new Error('connect ECONNREFUSED'));
    const service = new KycOcrService();

    const result = await service.extractIdentity({
      idFrontPath: __filename,
      idBackPath: __filename,
      expectedIdNumber: '087204009012',
      expectedDateOfBirth: '2004-10-08',
    });

    expect(result).toEqual({
      status: KycOcrStatus.FAILED,
      confidence: null,
      payload: { error: 'connect ECONNREFUSED' },
    });
  });
});
