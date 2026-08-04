import { NotFoundException } from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { ClinicStatus } from '../utils/enums/clinic-status.enum';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    save: jest.fn((value) => Promise.resolve(value)),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    remove: jest.fn(),
  };
}

describe('ClinicsService', () => {
  const clinicId = '11111111-1111-4111-8111-111111111111';

  function createService() {
    const repository = createRepositoryMock();
    const service = new ClinicsService(repository as any);
    return { service, repository };
  }

  describe('create', () => {
    it('should create a clinic', async () => {
      const { service, repository } = createService();

      const result = await service.create({
        clinic_name: 'S.M.I.L.E Central Clinic',
        clinic_code: 'SMILE001',
        address: '123 Nguyen Van Linh, District 7',
      } as any);

      expect(result).toEqual(
        expect.objectContaining({
          clinic_name: 'S.M.I.L.E Central Clinic',
          clinic_code: 'SMILE001',
        }),
      );
      expect(repository.save).toHaveBeenCalled();
    });

    it('should normalize license_expiry to a Date when provided', async () => {
      const { service, repository } = createService();

      await service.create({
        clinic_name: 'S.M.I.L.E Central Clinic',
        clinic_code: 'SMILE001',
        address: '123 Nguyen Van Linh, District 7',
        license_expiry: '2027-01-01',
      } as any);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ license_expiry: new Date('2027-01-01') }),
      );
    });
  });

  describe('findAll (View Clinic Information)', () => {
    it('should return paginated clinics with default paging', async () => {
      const { service, repository } = createService();
      repository.findAndCount.mockResolvedValue([[{ clinic_id: clinicId }], 1]);

      const result = await service.findAll({} as any);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
      expect(result).toEqual({ data: [{ clinic_id: clinicId }], total: 1 });
    });

    it('should filter by city and status', async () => {
      const { service, repository } = createService();
      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({
        page: 2,
        limit: 5,
        city: 'Hanoi',
        status: ClinicStatus.ACTIVE,
      } as any);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
          where: expect.objectContaining({ status: ClinicStatus.ACTIVE }),
        }),
      );
    });
  });

  describe('findById (View Clinic Details)', () => {
    it('should return the clinic with its treatment rooms', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue({ clinic_id: clinicId });

      const result = await service.findById(clinicId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { clinic_id: clinicId },
        relations: ['treatment_rooms'],
      });
      expect(result).toEqual({ clinic_id: clinicId });
    });

    it('should return null when clinic is missing', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue(null);

      const result = await service.findById(clinicId);

      expect(result).toBeNull();
    });
  });

  describe('findByCode', () => {
    it('should return the clinic by clinic_code', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue({
        clinic_id: clinicId,
        clinic_code: 'SMILE001',
      });

      const result = await service.findByCode('SMILE001');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { clinic_code: 'SMILE001' },
        relations: ['treatment_rooms'],
      });
      expect(result).toEqual(
        expect.objectContaining({ clinic_code: 'SMILE001' }),
      );
    });
  });

  describe('update (Update Clinic Information)', () => {
    it('should update clinic fields', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue({
        clinic_id: clinicId,
        clinic_name: 'Old Name',
        phone: '0000000000',
      });

      const result = await service.update(clinicId, {
        clinic_name: 'New Name',
      } as any);

      expect(result).toEqual(
        expect.objectContaining({
          clinic_id: clinicId,
          clinic_name: 'New Name',
        }),
      );
    });

    it('should keep prior license_expiry when not provided in the update', async () => {
      const { service, repository } = createService();
      const existingExpiry = new Date('2026-01-01');
      repository.findOne.mockResolvedValue({
        clinic_id: clinicId,
        license_expiry: existingExpiry,
      });

      const result = await service.update(clinicId, {
        clinic_name: 'New Name',
      } as any);

      expect(result).toEqual(
        expect.objectContaining({ license_expiry: existingExpiry }),
      );
    });

    it('should throw NotFoundException when clinic does not exist', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(clinicId, { clinic_name: 'New Name' } as any),
      ).rejects.toThrow(NotFoundException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove an existing clinic', async () => {
      const { service, repository } = createService();
      const clinic = { clinic_id: clinicId };
      repository.findOne.mockResolvedValue(clinic);

      await service.remove(clinicId);

      expect(repository.remove).toHaveBeenCalledWith(clinic);
    });

    it('should throw NotFoundException when removing a missing clinic', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(clinicId)).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
