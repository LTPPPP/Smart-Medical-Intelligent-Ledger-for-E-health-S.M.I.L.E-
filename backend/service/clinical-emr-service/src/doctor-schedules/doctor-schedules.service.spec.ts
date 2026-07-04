import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DoctorSchedulesService } from './doctor-schedules.service';
import { ScheduleStatus } from '../utils/enums/schedule-status.enum';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn((value) => Promise.resolve(value)),
  };
}

describe('DoctorSchedulesService', () => {
  const scheduleId = '11111111-1111-4111-8111-111111111111';
  const doctorId = '22222222-2222-4222-8222-222222222222';
  const clinicId = '33333333-3333-4333-8333-333333333333';
  const shiftId = '44444444-4444-4444-8444-444444444444';
  const roomId = '55555555-5555-4555-8555-555555555555';
  const actorId = '66666666-6666-4666-8666-666666666666';
  const targetDoctorId = '77777777-7777-4777-8777-777777777777';

  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue({ ok: true } as Response);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  function createService() {
    const scheduleRepository = createRepositoryMock();
    const changeRepository = createRepositoryMock();
    const service = new DoctorSchedulesService(
      scheduleRepository as any,
      changeRepository as any,
    );

    scheduleRepository.findOne.mockResolvedValue(null);

    return { service, scheduleRepository, changeRepository };
  }

  function createSchedule(overrides = {}) {
    return {
      doctor_id: doctorId,
      clinic_id: clinicId,
      shift_id: shiftId,
      room_id: roomId,
      work_date: '2026-07-15',
      max_patients: 20,
      ...overrides,
    };
  }

  it('rejects creating a schedule with a non-scheduled status override', async () => {
    const { service, scheduleRepository } = createService();

    await expect(
      service.create(
        createSchedule({
          status: ScheduleStatus.COMPLETED,
        }),
      ),
    ).rejects.toThrow(BadRequestException);

    expect(scheduleRepository.save).not.toHaveBeenCalled();
  });

  it('creates schedules as scheduled and rejects duplicate doctor date shift', async () => {
    const { service, scheduleRepository } = createService();

    const result = await service.create(createSchedule());

    expect(result).toEqual(
      expect.objectContaining({
        doctor_id: doctorId,
        status: ScheduleStatus.SCHEDULED,
      }),
    );
    expect(scheduleRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        doctor_id: doctorId,
        status: ScheduleStatus.SCHEDULED,
      }),
    );

    scheduleRepository.findOne.mockResolvedValue({
      schedule_id: scheduleId,
      doctor_id: doctorId,
      shift_id: shiftId,
    });

    await expect(service.create(createSchedule())).rejects.toThrow(
      ConflictException,
    );
  });

  it('requires changed_by when updating a schedule', async () => {
    const { service, scheduleRepository, changeRepository } = createService();
    scheduleRepository.findOne.mockResolvedValue({
      schedule_id: scheduleId,
      doctor_id: doctorId,
      work_date: new Date('2026-07-15'),
      shift_id: shiftId,
      room_id: roomId,
      max_patients: 20,
      status: ScheduleStatus.SCHEDULED,
      notes: null,
    });

    await expect(
      service.update(scheduleId, { notes: 'Changed' }),
    ).rejects.toThrow(BadRequestException);

    expect(changeRepository.save).not.toHaveBeenCalled();
  });

  it('rejects updating completed or cancelled schedules', async () => {
    const { service, scheduleRepository, changeRepository } = createService();
    scheduleRepository.findOne.mockResolvedValue({
      schedule_id: scheduleId,
      doctor_id: doctorId,
      work_date: new Date('2026-07-15'),
      shift_id: shiftId,
      room_id: roomId,
      max_patients: 20,
      status: ScheduleStatus.COMPLETED,
      notes: null,
    });

    await expect(
      service.update(scheduleId, { notes: 'Changed', changed_by: actorId }),
    ).rejects.toThrow(ConflictException);

    expect(changeRepository.save).not.toHaveBeenCalled();
  });

  it('updates scheduled schedules and writes a change log', async () => {
    const { service, scheduleRepository, changeRepository } = createService();
    scheduleRepository.findOne.mockResolvedValue({
      schedule_id: scheduleId,
      doctor_id: doctorId,
      work_date: new Date('2026-07-15'),
      shift_id: shiftId,
      room_id: roomId,
      max_patients: 20,
      status: ScheduleStatus.SCHEDULED,
      notes: null,
    });

    const result = await service.update(scheduleId, {
      notes: 'Changed',
      changed_by: actorId,
      change_reason: 'Room update',
    });

    expect(result.notes).toBe('Changed');
    expect(changeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        schedule_id: scheduleId,
        changed_by: actorId,
      }),
    );
  });

  it('rejects transferring completed schedules', async () => {
    const { service, scheduleRepository, changeRepository } = createService();
    scheduleRepository.findOne.mockResolvedValue({
      schedule_id: scheduleId,
      doctor_id: doctorId,
      work_date: new Date('2026-07-15'),
      shift_id: shiftId,
      status: ScheduleStatus.COMPLETED,
      notes: null,
    });

    await expect(
      service.transferShift(scheduleId, {
        to_doctor_id: targetDoctorId,
        transferred_by: actorId,
        reason: 'Coverage',
      }),
    ).rejects.toThrow(ConflictException);

    expect(changeRepository.save).not.toHaveBeenCalled();
  });

  it('rejects transferring a schedule to the same doctor', async () => {
    const { service, scheduleRepository, changeRepository } = createService();
    scheduleRepository.findOne.mockResolvedValue({
      schedule_id: scheduleId,
      doctor_id: doctorId,
      work_date: new Date('2026-07-15'),
      shift_id: shiftId,
      status: ScheduleStatus.SCHEDULED,
      notes: null,
    });

    await expect(
      service.transferShift(scheduleId, {
        to_doctor_id: doctorId,
        transferred_by: actorId,
        reason: 'Coverage',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(changeRepository.save).not.toHaveBeenCalled();
  });

  it('throws not found when updating a missing schedule', async () => {
    const { service } = createService();

    await expect(
      service.update(scheduleId, {
        notes: 'Changed',
        changed_by: actorId,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
