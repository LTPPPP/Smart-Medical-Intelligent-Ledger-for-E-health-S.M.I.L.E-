import {
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AppointmentAvailabilityService } from './appointment-availability.service';
import { AppointmentStatus } from '../utils/enums/appointment-status.enum';
import { RoomType } from '../utils/enums/room-type.enum';

const patientId = '10000000-0000-4000-8000-000000000001';
const serviceId = '20000000-0000-4000-8000-000000000001';
const doctorId = '30000000-0000-4000-8000-000000000001';
const clinicId = '40000000-0000-4000-8000-000000000001';
const roomId = '50000000-0000-4000-8000-000000000001';
const actorId = '60000000-0000-4000-8000-000000000001';

function createService(overrides: Record<string, any> = {}) {
  const serviceRepository = {
    findOne: jest.fn().mockResolvedValue({
      service_id: serviceId,
      service_name: 'Oral checking',
      duration_minutes: 30,
      required_room_type: RoomType.EXAMINATION,
    }),
  };
  const scheduleRepository = {
    find: jest.fn().mockResolvedValue([
      {
        schedule_id: 'schedule-1',
        doctor_id: doctorId,
        clinic_id: clinicId,
        work_date: new Date('2026-06-30'),
        shift: { start_time: '09:00:00', end_time: '12:00:00' },
        room_id: roomId,
        room: {
          room_id: roomId,
          room_name: 'Examination Room 1',
          room_type: RoomType.EXAMINATION,
        },
      },
    ]),
  };
  const appointmentRepository = {
    find: jest.fn().mockResolvedValue([]),
  };
  const optionTokens = {
    sign: jest.fn(({ start_time }) => `token-${start_time}`),
  };
  const patientsService = {
    findByUserId: jest.fn().mockResolvedValue(null),
  };
  const injectedPatientsService = {
    ...patientsService,
    ...overrides.patientsService,
  };

  return {
    service: new AppointmentAvailabilityService(
      { ...serviceRepository, ...overrides.serviceRepository } as any,
      { ...scheduleRepository, ...overrides.scheduleRepository } as any,
      { ...appointmentRepository, ...overrides.appointmentRepository } as any,
      { ...optionTokens, ...overrides.optionTokens } as any,
      injectedPatientsService as any,
    ),
    serviceRepository,
    scheduleRepository,
    appointmentRepository,
    optionTokens,
    patientsService: injectedPatientsService,
  };
}

describe('AppointmentAvailabilityService', () => {
  it('should return slots generated from service duration and signed option tokens', async () => {
    const { service, optionTokens, patientsService } = createService({
      patientsService: {
        findByUserId: jest.fn().mockResolvedValue({ patient_id: patientId }),
      },
    });

    const result = await service.findAvailability(
      {
        patient_id: patientId,
        service_id: serviceId,
        clinic_id: clinicId,
        date_from: '2026-06-30',
        date_to: '2026-06-30',
      },
      actorId,
    );

    expect(result.service.duration_minutes).toBe(30);
    expect(result.dates[0].doctors[0].clinic_id).toBe(clinicId);
    expect(result.dates[0].doctors[0].slots[0]).toEqual({
      option_token: 'token-09:00',
      start_time: '09:00',
      occupied_until: '09:55',
    });
    expect(optionTokens.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        patient_id: patientId,
        service_id: serviceId,
        doctor_id: doctorId,
        room_id: roomId,
        start_time: '09:00',
      }),
    );
    expect(patientsService.findByUserId).toHaveBeenCalledWith(actorId);
  });

  it('should reject availability lookups for a different authenticated patient', async () => {
    const { service, scheduleRepository, optionTokens } = createService({
      patientsService: {
        findByUserId: jest.fn().mockResolvedValue({ patient_id: patientId }),
      },
    });

    await expect(
      service.findAvailability(
        {
          patient_id: '10000000-0000-4000-8000-000000000002',
          service_id: serviceId,
          clinic_id: clinicId,
          date_from: '2026-06-30',
          date_to: '2026-06-30',
        },
        actorId,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(scheduleRepository.find).not.toHaveBeenCalled();
    expect(optionTokens.sign).not.toHaveBeenCalled();
  });

  it('should reject doctor schedules without an assigned room', async () => {
    const { service } = createService({
      scheduleRepository: {
        find: jest.fn().mockResolvedValue([
          {
            schedule_id: 'schedule-1',
            doctor_id: doctorId,
            clinic_id: clinicId,
            work_date: new Date('2026-06-30'),
            shift: { start_time: '09:00:00', end_time: '12:00:00' },
            room_id: null,
            room: null,
          },
        ]),
      },
    });

    await expect(
      service.findAvailability({
        patient_id: patientId,
        service_id: serviceId,
        date_from: '2026-06-30',
        date_to: '2026-06-30',
      }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('should reject incompatible room types instead of falling back', async () => {
    const { service } = createService({
      scheduleRepository: {
        find: jest.fn().mockResolvedValue([
          {
            schedule_id: 'schedule-1',
            doctor_id: doctorId,
            clinic_id: clinicId,
            work_date: new Date('2026-06-30'),
            shift: { start_time: '09:00:00', end_time: '12:00:00' },
            room_id: roomId,
            room: {
              room_id: roomId,
              room_name: 'Surgery Room 1',
              room_type: RoomType.SURGERY,
            },
          },
        ]),
      },
    });

    await expect(
      service.findAvailability({
        patient_id: patientId,
        service_id: serviceId,
        date_from: '2026-06-30',
        date_to: '2026-06-30',
      }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('should remove candidates overlapping active doctor, room, or patient appointments', async () => {
    const { service } = createService({
      appointmentRepository: {
        find: jest.fn().mockResolvedValue([
          {
            patient_id: 'other-patient',
            doctor_id: doctorId,
            room_id: roomId,
            appointment_date: new Date('2026-06-30'),
            appointment_time: '09:00',
            duration_minutes: 30,
            status: AppointmentStatus.SCHEDULED,
          },
        ]),
      },
    });

    const result = await service.findAvailability({
      patient_id: patientId,
      service_id: serviceId,
      date_from: '2026-06-30',
      date_to: '2026-06-30',
    });

    const starts = result.dates[0].doctors[0].slots.map(
      (slot) => slot.start_time,
    );
    expect(starts).not.toContain('09:00');
    expect(starts).not.toContain('09:15');
    expect(starts).toContain('10:00');
  });
});
