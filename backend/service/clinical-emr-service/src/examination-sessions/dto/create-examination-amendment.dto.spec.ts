import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateExaminationAmendmentDto } from './create-examination-amendment.dto';

describe('CreateExaminationAmendmentDto', () => {
  it('should trim text fields before validation', async () => {
    const dto = plainToInstance(CreateExaminationAmendmentDto, {
      amendment_reason: ' Correct typo ',
      amendment_text: ' Corrected tooth number. ',
      amended_by: '11111111-1111-4111-8111-111111111111',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.amendment_reason).toBe('Correct typo');
    expect(dto.amendment_text).toBe('Corrected tooth number.');
  });

  it('should reject whitespace-only amendment text after trimming', async () => {
    const dto = plainToInstance(CreateExaminationAmendmentDto, {
      amendment_reason: '   ',
      amendment_text: '  x ',
      amended_by: '11111111-1111-4111-8111-111111111111',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual([
      'amendment_reason',
      'amendment_text',
    ]);
  });
});
