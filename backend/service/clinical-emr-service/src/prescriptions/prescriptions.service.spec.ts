import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    save: jest.fn((value) => Promise.resolve(value)),
    remove: jest.fn(),
  };
}

describe('PrescriptionsService', () => {
  const prescriptionId = '11111111-1111-4111-8111-111111111111';
  const sessionId = '22222222-2222-4222-8222-222222222222';
  const patientId = '33333333-3333-4333-8333-333333333333';
  const doctorId = '44444444-4444-4444-8444-444444444444';
  const recordId = '55555555-5555-4555-8555-555555555555';

  function createService() {
    const prescriptionsRepository = createRepositoryMock();
    const sessionsRepository = createRepositoryMock();
    const prescriptionItemsRepository = createRepositoryMock();
    const service = new PrescriptionsService(
      prescriptionsRepository as any,
      sessionsRepository as any,
      prescriptionItemsRepository as any,
    );

    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      patient_id: patientId,
      doctor_id: doctorId,
      record_id: recordId,
      status: 'in_progress',
    });

    return {
      service,
      prescriptionsRepository,
      sessionsRepository,
      prescriptionItemsRepository,
    };
  }

  it('should requires a session when creating a prescription', async () => {
    const { service, prescriptionsRepository } = createService();

    await expect(
      service.create({
        patient_id: patientId,
        doctor_id: doctorId,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prescriptionsRepository.save).not.toHaveBeenCalled();
  });

  it('should rejects creating a prescription for a finalized session', async () => {
    const { service, prescriptionsRepository, sessionsRepository } =
      createService();
    sessionsRepository.findOne.mockResolvedValue({
      session_id: sessionId,
      patient_id: patientId,
      doctor_id: doctorId,
      record_id: recordId,
      status: 'completed',
    });

    await expect(
      service.create({
        session_id: sessionId,
        patient_id: patientId,
        doctor_id: doctorId,
      }),
    ).rejects.toThrow(ConflictException);

    expect(prescriptionsRepository.save).not.toHaveBeenCalled();
  });

  it('should rejects creating a prescription when patient or doctor does not match the session', async () => {
    const { service, prescriptionsRepository } = createService();

    await expect(
      service.create({
        session_id: sessionId,
        patient_id: '66666666-6666-4666-8666-666666666666',
        doctor_id: doctorId,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prescriptionsRepository.save).not.toHaveBeenCalled();
  });

  it('should creates prescriptions as draft and derives context from the session', async () => {
    const { service, prescriptionsRepository } = createService();

    const result = await service.create({
      session_id: sessionId,
      patient_id: patientId,
      doctor_id: doctorId,
      notes: 'After meal',
    });

    expect(result).toEqual(
      expect.objectContaining({
        session_id: sessionId,
        patient_id: patientId,
        doctor_id: doctorId,
        record_id: recordId,
        status: 'draft',
      }),
    );
    expect(prescriptionsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: sessionId,
        patient_id: patientId,
        doctor_id: doctorId,
        record_id: recordId,
        status: 'draft',
      }),
    );
  });

  it('should rejects creating prescriptions with a non-draft status override', async () => {
    const { service, prescriptionsRepository } = createService();

    await expect(
      service.create({
        session_id: sessionId,
        patient_id: patientId,
        doctor_id: doctorId,
        status: 'issued',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prescriptionsRepository.save).not.toHaveBeenCalled();
  });

  it('should rejects issue when the prescription has no medication items', async () => {
    const { service, prescriptionsRepository, prescriptionItemsRepository } =
      createService();
    prescriptionsRepository.findOne.mockResolvedValue({
      prescription_id: prescriptionId,
      session_id: sessionId,
      patient_id: patientId,
      doctor_id: doctorId,
      status: 'draft',
    });
    prescriptionItemsRepository.find.mockResolvedValue([]);

    await expect(service.issue(prescriptionId)).rejects.toThrow(
      BadRequestException,
    );

    expect(prescriptionsRepository.save).not.toHaveBeenCalled();
  });

  it('should issues and signs a draft prescription by the prescribing doctor', async () => {
    const { service, prescriptionsRepository, prescriptionItemsRepository } =
      createService();
    const prescription = {
      prescription_id: prescriptionId,
      session_id: sessionId,
      patient_id: patientId,
      doctor_id: doctorId,
      status: 'draft',
      issued_at: null,
      issued_by: null,
    };
    prescriptionsRepository.findOne.mockResolvedValue(prescription);
    prescriptionItemsRepository.find.mockResolvedValue([
      {
        prescription_id: prescriptionId,
        medication_name: 'Amoxicillin',
        dosage: '500 mg',
        route: 'oral',
        frequency: '3 times/day',
        duration_days: 7,
        quantity: 21,
        instructions: 'Take after meals.',
      },
    ]);

    const result = await service.issue(prescriptionId);

    expect(result.status).toBe('issued');
    expect(result.issued_at).toBeInstanceOf(Date);
    expect(result.issued_by).toBe(doctorId);
  });

  it('should rejects issue when any medication item lacks legal dosing details', async () => {
    const { service, prescriptionsRepository, prescriptionItemsRepository } =
      createService();
    prescriptionsRepository.findOne.mockResolvedValue({
      prescription_id: prescriptionId,
      session_id: sessionId,
      patient_id: patientId,
      doctor_id: doctorId,
      status: 'draft',
    });
    prescriptionItemsRepository.find.mockResolvedValue([
      {
        prescription_id: prescriptionId,
        medication_name: 'Amoxicillin',
        dosage: '500 mg',
        route: null,
        frequency: '3 times/day',
        duration_days: 7,
        quantity: 21,
        instructions: 'Take after meals.',
      },
    ]);

    await expect(service.issue(prescriptionId)).rejects.toThrow(
      BadRequestException,
    );

    expect(prescriptionsRepository.save).not.toHaveBeenCalled();
  });

  it('should rejects updates after a prescription is issued', async () => {
    const { service, prescriptionsRepository } = createService();
    prescriptionsRepository.findOne.mockResolvedValue({
      prescription_id: prescriptionId,
      session_id: sessionId,
      status: 'issued',
    });

    await expect(
      service.update(prescriptionId, { notes: 'Changed' }),
    ).rejects.toThrow(ConflictException);

    expect(prescriptionsRepository.save).not.toHaveBeenCalled();
  });

  it('should updates draft prescription clinical metadata', async () => {
    const { service, prescriptionsRepository } = createService();
    prescriptionsRepository.findOne.mockResolvedValue({
      prescription_id: prescriptionId,
      session_id: sessionId,
      record_id: recordId,
      patient_id: patientId,
      doctor_id: doctorId,
      status: 'draft',
      notes: null,
    });

    const result = await service.update(prescriptionId, {
      notes: 'Take after meal',
    });

    expect(result).toEqual(
      expect.objectContaining({
        session_id: sessionId,
        record_id: recordId,
        patient_id: patientId,
        doctor_id: doctorId,
        status: 'draft',
        notes: 'Take after meal',
      }),
    );
  });

  it('should rejects changing prescription context or signing fields through update', async () => {
    const { service, prescriptionsRepository } = createService();
    prescriptionsRepository.findOne.mockResolvedValue({
      prescription_id: prescriptionId,
      session_id: sessionId,
      record_id: recordId,
      patient_id: patientId,
      doctor_id: doctorId,
      status: 'draft',
      digital_signature_id: null,
    });

    await expect(
      service.update(prescriptionId, {
        session_id: '66666666-6666-4666-8666-666666666666',
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.update(prescriptionId, {
        patient_id: '77777777-7777-4777-8777-777777777777',
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.update(prescriptionId, {
        doctor_id: '88888888-8888-4888-8888-888888888888',
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.update(prescriptionId, {
        record_id: '99999999-9999-4999-8999-999999999999',
      }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.update(prescriptionId, { status: 'issued' }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.update(prescriptionId, { digital_signature_id: 'sig-1' }),
    ).rejects.toThrow(BadRequestException);

    expect(prescriptionsRepository.save).not.toHaveBeenCalled();
  });

  it('should rejects updating draft prescriptions after the linked encounter is finalized', async () => {
    const { service, prescriptionsRepository } = createService();
    prescriptionsRepository.findOne.mockResolvedValue({
      prescription_id: prescriptionId,
      session_id: sessionId,
      status: 'draft',
      session: {
        status: 'completed',
        signed_at: new Date(),
      },
    });

    await expect(
      service.update(prescriptionId, { notes: 'Changed' }),
    ).rejects.toThrow(ConflictException);

    expect(prescriptionsRepository.save).not.toHaveBeenCalled();
  });

  it('should rejects issuing draft prescriptions after the linked encounter is finalized', async () => {
    const { service, prescriptionsRepository, prescriptionItemsRepository } =
      createService();
    prescriptionsRepository.findOne.mockResolvedValue({
      prescription_id: prescriptionId,
      session_id: sessionId,
      patient_id: patientId,
      doctor_id: doctorId,
      status: 'draft',
      session: {
        status: 'completed',
        signed_at: new Date(),
      },
    });
    prescriptionItemsRepository.find.mockResolvedValue([
      {
        prescription_id: prescriptionId,
        medication_name: 'Amoxicillin',
        dosage: '500 mg',
        route: 'oral',
        frequency: '3 times/day',
        duration_days: 7,
        quantity: 21,
        instructions: 'Take after meals.',
      },
    ]);

    await expect(service.issue(prescriptionId)).rejects.toThrow(
      ConflictException,
    );

    expect(prescriptionItemsRepository.count).not.toHaveBeenCalled();
    expect(prescriptionsRepository.save).not.toHaveBeenCalled();
  });

  it('should rejects deleting draft prescriptions after the linked encounter is finalized', async () => {
    const { service, prescriptionsRepository } = createService();
    prescriptionsRepository.findOne.mockResolvedValue({
      prescription_id: prescriptionId,
      session_id: sessionId,
      status: 'draft',
      session: {
        status: 'signed',
        signed_at: new Date(),
      },
    });

    await expect(service.remove(prescriptionId)).rejects.toThrow(
      ConflictException,
    );

    expect(prescriptionsRepository.remove).not.toHaveBeenCalled();
  });

  it('should requires a cancellation reason and cancels a non-issued prescription', async () => {
    const { service, prescriptionsRepository } = createService();
    prescriptionsRepository.findOne.mockResolvedValue({
      prescription_id: prescriptionId,
      session_id: sessionId,
      status: 'draft',
      cancelled_at: null,
      cancellation_reason: null,
    });

    await expect(service.cancel(prescriptionId, '')).rejects.toThrow(
      BadRequestException,
    );

    const result = await service.cancel(prescriptionId, 'Entry mistake');

    expect(result.status).toBe('cancelled');
    expect(result.cancelled_at).toBeInstanceOf(Date);
    expect(result.cancellation_reason).toBe('Entry mistake');
  });

  it('should throws not found when the linked session is missing', async () => {
    const { service, sessionsRepository } = createService();
    sessionsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        session_id: sessionId,
        patient_id: patientId,
        doctor_id: doctorId,
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
