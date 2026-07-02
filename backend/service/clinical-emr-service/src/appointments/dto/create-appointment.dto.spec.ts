import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAppointmentDto } from './create-appointment.dto';

describe('CreateAppointmentDto', () => {
  it('should retain follow-up source links under whitelist validation', async () => {
    const dto = plainToInstance(CreateAppointmentDto, {
      patient_id: 'p0000000-0000-0000-0000-000000000001',
      doctor_id: 'd0000000-0000-0000-0000-000000000001',
      clinic_id: 'c0000000-0000-0000-0000-000000000001',
      appointment_date: '2026-06-15',
      appointment_time: '09:00',
      created_by: 'u0000000-0000-0000-0000-000000000001',
      session_id: 'e0000000-0000-0000-0000-000000000001',
      treatment_plan_id: 'f0000000-0000-0000-0000-000000000001',
    });

    await validate(dto, { whitelist: true });

    expect(dto.session_id).toBe('e0000000-0000-0000-0000-000000000001');
    expect(dto.treatment_plan_id).toBe(
      'f0000000-0000-0000-0000-000000000001',
    );
  });
});
