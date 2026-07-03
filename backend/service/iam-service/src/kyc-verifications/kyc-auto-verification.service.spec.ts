import {
  KycOcrStatus,
  KycStatus,
} from './entities/kyc-verification.entity';
import { KycAutoVerificationService } from './kyc-auto-verification.service';

describe('KycAutoVerificationService', () => {
  const service = new KycAutoVerificationService();

  const eligibleInput = () => ({
    verificationStatus: KycStatus.PENDING_REVIEW,
    ocrStatus: KycOcrStatus.COMPLETED,
    confidence: 91,
    submitted: {
      idNumber: '087204009012',
      fullName: 'Trần Đại Nhân',
      dateOfBirth: '2004-10-08',
    },
    payload: {
      documentType: 'CITIZEN_ID',
      idNumber: '087204009012',
      fullName: 'TRAN DAI NHAN',
      dateOfBirth: '2004-10-08',
      riskLevel: 'LOW',
      front: { side: 'FRONT' },
      back: { side: 'BACK' },
      checks: [
        { code: 'OCR_COMPLETED', status: 'PASS' },
        { code: 'OCR_CONFIDENCE', status: 'PASS' },
        { code: 'ID_NUMBER_MATCH', status: 'PASS' },
        { code: 'DOB_MATCH', status: 'PASS' },
        { code: 'NAME_APPEARS_IN_TEXT', status: 'PASS' },
      ],
    },
  });

  afterEach(() => {
    delete process.env.KYC_AUTO_VERIFY_CONFIDENCE;
  });

  it('allows automatic verification only when every criterion passes', () => {
    expect(service.evaluate(eligibleInput())).toEqual({
      eligible: true,
      reason: 'All automatic verification checks passed.',
      failedCriteria: [],
    });
  });

  it.each([
    ['terminal decision', { verificationStatus: KycStatus.VERIFIED }, 'DECISION_NOT_PENDING'],
    ['OCR status', { ocrStatus: KycOcrStatus.FAILED }, 'OCR_NOT_COMPLETED'],
    ['missing confidence', { confidence: null }, 'CONFIDENCE_UNAVAILABLE'],
    ['low confidence', { confidence: 79 }, 'CONFIDENCE_BELOW_THRESHOLD'],
    [
      'document type',
      { payload: { ...eligibleInput().payload, documentType: 'PASSPORT' } },
      'DOCUMENT_TYPE_MISMATCH',
    ],
    [
      'front side',
      { payload: { ...eligibleInput().payload, front: { side: 'BACK' } } },
      'FRONT_SIDE_MISMATCH',
    ],
    [
      'back side',
      { payload: { ...eligibleInput().payload, back: { side: 'FRONT' } } },
      'BACK_SIDE_MISMATCH',
    ],
    [
      'ID number',
      { payload: { ...eligibleInput().payload, idNumber: '087204009099' } },
      'ID_NUMBER_MISMATCH',
    ],
    [
      'full name',
      { payload: { ...eligibleInput().payload, fullName: 'NGUYEN VAN KHAC' } },
      'FULL_NAME_MISMATCH',
    ],
    [
      'date of birth',
      { payload: { ...eligibleInput().payload, dateOfBirth: '2004-10-09' } },
      'DATE_OF_BIRTH_MISMATCH',
    ],
  ])('blocks automatic verification for %s', (_label, override, expectedCode) => {
    const input = { ...eligibleInput(), ...override };

    const result = service.evaluate(input);

    expect(result.eligible).toBe(false);
    expect(result.failedCriteria).toContain(expectedCode);
  });

  it.each(['WARNING', 'FAIL'])(
    'blocks automatic verification when any check is %s',
    (status) => {
      const input = eligibleInput();
      input.payload.checks = [
        ...input.payload.checks,
        { code: 'CARD_QUALITY', status },
      ];

      const result = service.evaluate(input);

      expect(result.eligible).toBe(false);
      expect(result.failedCriteria).toContain('NON_PASSING_CHECKS');
    },
  );

  it('uses the configured confidence threshold', () => {
    process.env.KYC_AUTO_VERIFY_CONFIDENCE = '95';

    const result = new KycAutoVerificationService().evaluate(eligibleInput());

    expect(result.eligible).toBe(false);
    expect(result.failedCriteria).toContain('CONFIDENCE_BELOW_THRESHOLD');
  });
});
