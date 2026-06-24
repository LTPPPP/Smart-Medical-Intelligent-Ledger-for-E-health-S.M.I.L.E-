import { JwtService } from '@nestjs/jwt';
import { AppointmentOptionTokenService } from './appointment-option-token.service';

describe('AppointmentOptionTokenService', () => {
  const originalOptionSecret = process.env.APPOINTMENT_OPTION_TOKEN_SECRET;
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalAuthJwtSecret = process.env.AUTH_JWT_SECRET;

  afterEach(() => {
    process.env.APPOINTMENT_OPTION_TOKEN_SECRET = originalOptionSecret;
    process.env.JWT_SECRET = originalJwtSecret;
    process.env.AUTH_JWT_SECRET = originalAuthJwtSecret;
  });

  it('uses the application auth JWT secret when no option-specific secret exists', () => {
    delete process.env.APPOINTMENT_OPTION_TOKEN_SECRET;
    delete process.env.JWT_SECRET;
    process.env.AUTH_JWT_SECRET = 'local-test-secret';
    const service = new AppointmentOptionTokenService(new JwtService());
    const claims = {
      patient_id: '10000000-0000-4000-8000-000000000001',
      service_id: '20000000-0000-4000-8000-000000000001',
      clinic_id: '30000000-0000-4000-8000-000000000001',
      doctor_id: '40000000-0000-4000-8000-000000000001',
      room_id: '50000000-0000-4000-8000-000000000001',
      work_date: '2026-06-25',
      start_time: '09:00',
    };

    const token = service.sign(claims);

    expect(service.verify(token)).toEqual(expect.objectContaining(claims));
  });
});
