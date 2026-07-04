import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAppointmentDto } from './create-appointment.dto';

describe('CreateAppointmentDto', () => {
  it('should retain follow-up source links under whitelist validation', async () => {
    const dto = plainToInstance(CreateAppointmentDto, {
      patient_id: '00000000-0000-4000-8000-000000000001',
      doctor_id: '00000000-0000-4000-8000-000000000002',
      clinic_id: '00000000-0000-4000-8000-000000000003',
      appointment_date: '2026-06-15',
      appointment_time: '09:00',
      created_by: '00000000-0000-4000-8000-000000000004',
      session_id: '00000000-0000-4000-8000-000000000005',
      treatment_plan_id: '00000000-0000-4000-8000-000000000006',
    });

    const errors = await validate(dto, { whitelist: true });

    expect(errors).toHaveLength(0);
    expect(dto.session_id).toBe('00000000-0000-4000-8000-000000000005');
    expect(dto.treatment_plan_id).toBe(
      '00000000-0000-4000-8000-000000000006',
    );
  });

  it('should reject non-UUID appointment actor and resource IDs', async () => {
    const dto = plainToInstance(CreateAppointmentDto, {
      patient_id: 'patient-1',
      doctor_id: 'doctor-1',
      clinic_id: 'clinic-1',
      room_id: 'room-1',
      service_id: 'service-1',
      appointment_date: '2026-06-15',
      appointment_time: '09:00',
      approved_by: 'admin-1',
      created_by: 'user-1',
    });

    const errors = await validate(dto);
    const invalidFields = errors.map((error) => error.property);

    expect(invalidFields).toEqual(
      expect.arrayContaining([
        'patient_id',
        'doctor_id',
        'clinic_id',
        'room_id',
        'service_id',
        'approved_by',
        'created_by',
      ]),
    );
  });
});
