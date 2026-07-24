import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePatientRepresentativeDto } from './create-patient-representative.dto';
import { UpdatePatientRepresentativeDto } from './update-patient-representative.dto';

describe('Patient representative DTO validation', () => {
  it('should accept valid legal representative contact and document metadata', async () => {
    const dto = plainToInstance(CreatePatientRepresentativeDto, {
      patient_id: '00000000-0000-4000-8000-000000000001',
      full_name: 'Tran Thi Guardian',
      relationship: 'mother',
      phone: '+84 901 111 111',
      email: 'guardian@example.com',
      legal_document_type: 'CCCD',
      legal_document_number: '012345678901',
      authorized_for_treatment: true,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('should reject malformed representative PII and legal document fields', async () => {
    const dto = plainToInstance(CreatePatientRepresentativeDto, {
      patient_id: 'not-a-uuid',
      full_name: 'x'.repeat(256),
      relationship: 'x'.repeat(101),
      phone: 'call-me',
      email: 'not-email',
      legal_document_type: '<script>',
      legal_document_number: 'bad document #',
      authorized_for_treatment: true,
    });

    const errors = await validate(dto);
    const invalidFields = errors.map((error) => error.property);

    expect(invalidFields).toEqual(
      expect.arrayContaining([
        'patient_id',
        'full_name',
        'relationship',
        'phone',
        'email',
        'legal_document_type',
        'legal_document_number',
      ]),
    );
  });

  it('should reject malformed representative update contact fields', async () => {
    const dto = plainToInstance(UpdatePatientRepresentativeDto, {
      email: 'bad-email',
      phone: 'abc',
      legal_document_number: '###',
    });

    const errors = await validate(dto);
    const invalidFields = errors.map((error) => error.property);

    expect(invalidFields).toEqual(
      expect.arrayContaining(['email', 'phone', 'legal_document_number']),
    );
  });
});
