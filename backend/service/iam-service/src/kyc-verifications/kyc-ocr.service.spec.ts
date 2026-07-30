import axios from 'axios';
import { KycOcrStatus } from './entities/kyc-verification.entity';
import { KycOcrService } from './kyc-ocr.service';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('KycOcrService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.KYC_OCR_ENABLED = 'true';
    process.env.KYC_OCR_URL = 'http://kyc-ocr-service:8010';
    delete process.env.KYC_PADDLE_OCR_URL;
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

  it('posts front and back images to fast OCR and normalizes the response', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        engine: 'scanocr-onnx-vietocr-fast',
        front: {
          fields: {
            document_type: 'CITIZEN_ID',
            id_number: '087204009012',
            full_name: 'TRAN DAI NHAN',
            date_of_birth: '2004-10-08',
            place_of_origin: 'QUOI AN, VUNG LIEM, VINH LONG',
            place_of_residence: 'AP NHAT, QUOI AN, VUNG LIEM, VINH LONG',
          },
          raw_text: 'So 087204009012 Ho va ten TRAN DAI NHAN Ngay sinh 08/10/2004',
          risk_level: 'LOW',
          lines: [{ confidence: 0.91 }, { confidence: 0.89 }],
          checks: {
            ID_NUMBER_FOUND: { status: 'PASS', message: 'Found ID' },
            CARD_DETECTED: { status: 'PASS', message: 'Detected front card' },
            BACK_SIDE_HINT: { status: 'WARNING', message: 'Not the back side' },
          },
        },
        back: {
          fields: {
            document_type: 'CITIZEN_ID',
            id_number: '087204009012',
            issue_date: '2021-11-22',
            expiry_date: '2029-10-08',
          },
          raw_text: 'IDVNM2040090122087204009012<3',
          risk_level: 'LOW',
          lines: [{ confidence: 0.95 }],
          checks: {
            BACK_SIDE_HINT: { status: 'PASS', message: 'Looks like back' },
            FRONT_SIDE_HINT: { status: 'WARNING', message: 'Not the front side' },
            CARD_DETECTED: { status: 'PASS', message: 'Detected back card' },
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
          provider: 'scanocr-onnx-vietocr-fast',
          rawText: expect.stringContaining('087204009012'),
          documentType: 'CITIZEN_ID',
          idNumber: '087204009012',
          fullName: 'TRAN DAI NHAN',
          dateOfBirth: '2004-10-08',
          issueDate: '2021-11-22',
          expiryDate: '2029-10-08',
          placeOfOrigin: 'QUOI AN, VUNG LIEM, VINH LONG',
          placeOfResidence: 'AP NHAT, QUOI AN, VUNG LIEM, VINH LONG',
          riskLevel: 'LOW',
          automatedChecks: expect.arrayContaining([
            expect.objectContaining({ code: 'FRONT_BACK_ID_MATCH', status: 'PASS' }),
            expect.objectContaining({ code: 'FRONT_CARD_DETECTED', status: 'PASS' }),
            expect.objectContaining({ code: 'BACK_CARD_DETECTED', status: 'PASS' }),
          ]),
        }),
      }),
    );
    expect(result.payload.automatedChecks).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'FRONT_BACK_SIDE_HINT' }),
        expect.objectContaining({ code: 'BACK_FRONT_SIDE_HINT' }),
      ]),
    );
  });

  it('returns failed OCR when fast OCR rejects', async () => {
    const rawError = 'sentinel-patient@example.test connect ECONNREFUSED private-host:8010';
    mockedAxios.post.mockRejectedValue(
      Object.assign(new Error(rawError), {
        code: 'ECONNREFUSED',
      }),
    );
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
      payload: {
        error: 'error_class=Error error_code=ECONNREFUSED',
      },
    });
    expect(JSON.stringify(result)).not.toContain(rawError);
  });

  it('supports the legacy Paddle OCR URL env name while services migrate', async () => {
    delete process.env.KYC_OCR_URL;
    process.env.KYC_PADDLE_OCR_URL = 'http://legacy-ocr:8010/';
    mockedAxios.post.mockResolvedValue({
      data: {
        engine: 'scanocr-onnx-vietocr-fast',
        front: { fields: {}, lines: [], checks: {} },
        back: { fields: {}, lines: [], checks: {} },
        checks: {},
      },
    });
    const service = new KycOcrService();

    await service.extractIdentity({
      idFrontPath: __filename,
      idBackPath: __filename,
      expectedIdNumber: '087204009012',
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://legacy-ocr:8010/v1/ocr/cccd',
      expect.anything(),
      expect.anything(),
    );
  });
});
