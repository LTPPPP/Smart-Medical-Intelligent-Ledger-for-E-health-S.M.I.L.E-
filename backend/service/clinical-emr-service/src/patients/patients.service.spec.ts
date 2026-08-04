import { NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    save: jest.fn((value) => Promise.resolve(value)),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };
}

describe('PatientsService', () => {
  const patientId = '11111111-1111-4111-8111-111111111111';
  const userId = '22222222-2222-4222-8222-222222222222';

  function createService() {
    const repository = createRepositoryMock();
    const service = new PatientsService(repository as any);
    return { service, repository };
  }

  describe('create (Add Patient Profile)', () => {
    it('should create a patient with a server-generated code when none is provided', async () => {
      const { service, repository } = createService();

      const result = await service.create({
        full_name: 'Nguyen Van A',
      } as any);

      expect(result.patient_code).toMatch(/^PT-/);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should keep the caller-provided patient_code', async () => {
      const { service, repository } = createService();

      const result = await service.create({
        full_name: 'Nguyen Van A',
        patient_code: 'PAT-001',
      } as any);

      expect(result).toEqual(
        expect.objectContaining({ patient_code: 'PAT-001' }),
      );
      expect(repository.save).toHaveBeenCalledTimes(1);
    });

    it('should retry with a new generated code on a duplicate-key conflict', async () => {
      const { service, repository } = createService();
      const duplicateError = { code: '23505' };
      repository.save
        .mockRejectedValueOnce(duplicateError)
        .mockImplementationOnce((value) => Promise.resolve(value));

      const result = await service.create({ full_name: 'Nguyen Van A' } as any);

      expect(repository.save).toHaveBeenCalledTimes(2);
      expect(result.patient_code).toMatch(/^PT-/);
    });

    it('should rethrow a duplicate-key conflict when an explicit patient_code is reused', async () => {
      const { service, repository } = createService();
      const duplicateError = { code: '23505' };
      repository.save.mockRejectedValue(duplicateError);

      await expect(
        service.create({
          full_name: 'Nguyen Van A',
          patient_code: 'PAT-001',
        } as any),
      ).rejects.toBe(duplicateError);
      expect(repository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll (View Patient Profile)', () => {
    it('should return all patients', async () => {
      const { service, repository } = createService();
      repository.find.mockResolvedValue([{ patient_id: patientId }]);

      const result = await service.findAll();

      expect(result).toEqual([{ patient_id: patientId }]);
    });
  });

  describe('findOne (View Patient Profile)', () => {
    it('should return the patient by id', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue({ patient_id: patientId });

      const result = await service.findOne(patientId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { patient_id: patientId },
      });
      expect(result).toEqual({ patient_id: patientId });
    });

    it('should throw NotFoundException when patient is missing', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(patientId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByUserId', () => {
    it('should return the patient linked to a user account', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue({
        patient_id: patientId,
        user_id: userId,
      });

      const result = await service.findByUserId(userId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { user_id: userId },
      });
      expect(result).toEqual(expect.objectContaining({ user_id: userId }));
    });

    it('should return null when no patient is linked to the user', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByUserId(userId);

      expect(result).toBeNull();
    });
  });

  describe('createForSelf (Add Patient Profile)', () => {
    it('should create a self-service patient profile for a new user', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue(null);

      const result = await service.createForSelf(userId, {
        full_name: 'Nguyen Van A',
      } as any);

      expect(result).toEqual(
        expect.objectContaining({
          user_id: userId,
          patient_code: `PT-SELF-${userId.slice(0, 8).toUpperCase()}`,
        }),
      );
      expect(repository.save).toHaveBeenCalled();
    });

    it('should return the existing patient profile instead of creating a duplicate', async () => {
      const { service, repository } = createService();
      const existing = { patient_id: patientId, user_id: userId };
      repository.findOne.mockResolvedValue(existing);

      const result = await service.createForSelf(userId, {
        full_name: 'Nguyen Van A',
      } as any);

      expect(result).toBe(existing);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByCode', () => {
    it('should return the patient by patient_code', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue({
        patient_id: patientId,
        patient_code: 'PAT-001',
      });

      const result = await service.findByCode('PAT-001');

      expect(result).toEqual(
        expect.objectContaining({ patient_code: 'PAT-001' }),
      );
    });

    it('should throw NotFoundException when code does not match any patient', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue(null);

      await expect(service.findByCode('UNKNOWN')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update (Update Patient Profile)', () => {
    it('should update patient fields', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue({
        patient_id: patientId,
        full_name: 'Old Name',
      });

      const result = await service.update(patientId, {
        full_name: 'New Name',
      } as any);

      expect(result).toEqual(
        expect.objectContaining({
          patient_id: patientId,
          full_name: 'New Name',
        }),
      );
    });

    it('should throw NotFoundException when updating a missing patient', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(patientId, { full_name: 'New Name' } as any),
      ).rejects.toThrow(NotFoundException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove an existing patient', async () => {
      const { service, repository } = createService();
      const patient = { patient_id: patientId };
      repository.findOne.mockResolvedValue(patient);

      await service.remove(patientId);

      expect(repository.remove).toHaveBeenCalledWith(patient);
    });

    it('should throw NotFoundException when removing a missing patient', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(patientId)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });

  describe('blockBooking / unblockBooking', () => {
    it('should block booking with a reason and timestamp', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue({
        patient_id: patientId,
        booking_blocked: false,
      });

      const result = await service.blockBooking(patientId, 'No-show history');

      expect(result.booking_blocked).toBe(true);
      expect(result.booking_blocked_reason).toBe('No-show history');
      expect(result.booking_blocked_at).toBeInstanceOf(Date);
    });

    it('should unblock booking and clear the reason', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue({
        patient_id: patientId,
        booking_blocked: true,
        booking_blocked_reason: 'No-show history',
        booking_blocked_at: new Date(),
      });

      const result = await service.unblockBooking(patientId);

      expect(result.booking_blocked).toBe(false);
      expect(result.booking_blocked_reason).toBeNull();
      expect(result.booking_blocked_at).toBeNull();
    });
  });
});
