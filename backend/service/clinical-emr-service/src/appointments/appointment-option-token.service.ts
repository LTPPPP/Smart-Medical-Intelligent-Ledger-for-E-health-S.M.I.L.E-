import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AppointmentOptionClaims {
  patient_id: string;
  service_id: string;
  clinic_id: string;
  doctor_id: string;
  room_id: string;
  work_date: string;
  start_time: string;
}

@Injectable()
export class AppointmentOptionTokenService {
  constructor(private readonly jwtService: JwtService) {}

  sign(claims: AppointmentOptionClaims): string {
    return this.jwtService.sign(claims, {
      secret: this.secret(),
      issuer: 'clinical-emr',
      audience: 'appointment-option',
      expiresIn: '10m',
    });
  }

  verify(token: string): AppointmentOptionClaims {
    try {
      return this.jwtService.verify<AppointmentOptionClaims>(token, {
        secret: this.secret(),
        issuer: 'clinical-emr',
        audience: 'appointment-option',
      });
    } catch {
      throw new BadRequestException('APPOINTMENT_OPTION_TOKEN_INVALID');
    }
  }

  private secret(): string | undefined {
    return (
      process.env.APPOINTMENT_OPTION_TOKEN_SECRET ||
      process.env.JWT_SECRET ||
      process.env.AUTH_JWT_SECRET
    );
  }
}
