import { KycOcrAssessmentService } from './kyc-ocr-assessment.service';

describe('KycOcrAssessmentService', () => {
  const service = new KycOcrAssessmentService();

  it('marks low risk when OCR completed, confidence is high, and submitted data appears in OCR text', () => {
    const result = service.assess({
      submitted: {
        idNumber: '079123456789',
        fullName: 'Nguyen Van A',
        dateOfBirth: '1995-06-15',
      },
      ocr: {
        status: 'COMPLETED',
        confidence: 91,
        payload: {
          rawText: 'So 079123456789 Ho va ten NGUYEN VAN A Ngay sinh 15/06/1995',
          idNumber: '079123456789',
          dateOfBirth: '1995-06-15',
        },
      },
    });

    expect(result.riskLevel).toBe('LOW');
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'OCR_COMPLETED', status: 'PASS' }),
        expect.objectContaining({ code: 'ID_NUMBER_MATCH', status: 'PASS' }),
        expect.objectContaining({ code: 'DOB_MATCH', status: 'PASS' }),
        expect.objectContaining({ code: 'NAME_APPEARS_IN_TEXT', status: 'PASS' }),
      ]),
    );
  });

  it('marks high risk when OCR extracts a different ID number', () => {
    const result = service.assess({
      submitted: {
        idNumber: '079123456789',
        fullName: 'Nguyen Van A',
        dateOfBirth: '1995-06-15',
      },
      ocr: {
        status: 'COMPLETED',
        confidence: 88,
        payload: {
          rawText: 'So 001122334455 Ho va ten NGUYEN VAN A Ngay sinh 15/06/1995',
          idNumber: '001122334455',
          dateOfBirth: '1995-06-15',
        },
      },
    });

    expect(result.riskLevel).toBe('HIGH');
    expect(result.riskReason).toContain('ID number mismatch');
    expect(result.riskReason).not.toContain('079123456789');
    expect(result.riskReason).not.toContain('001122334455');
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'ID_NUMBER_MATCH', status: 'FAIL' }),
      ]),
    );
  });

  it('marks medium risk when OCR completes but confidence is low and optional fields are not confidently matched', () => {
    const result = service.assess({
      submitted: {
        idNumber: '079123456789',
        fullName: 'Nguyen Van A',
        dateOfBirth: '1995-06-15',
      },
      ocr: {
        status: 'COMPLETED',
        confidence: 63,
        payload: {
          rawText: 'CAN CUOC CONG DAN 079123456789',
          idNumber: '079123456789',
        },
      },
    });

    expect(result.riskLevel).toBe('MEDIUM');
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'OCR_CONFIDENCE', status: 'WARNING' }),
        expect.objectContaining({ code: 'DOB_MATCH', status: 'WARNING' }),
        expect.objectContaining({ code: 'NAME_APPEARS_IN_TEXT', status: 'WARNING' }),
      ]),
    );
  });
});
