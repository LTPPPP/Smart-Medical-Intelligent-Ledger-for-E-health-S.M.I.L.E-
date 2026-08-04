import { ConflictException, NotFoundException } from '@nestjs/common';
import { SpecialtiesService } from './specialties.service';

function createSpecialtyRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    save: jest.fn((value) =>
      Promise.resolve({ specialty_id: 'generated-id', ...value }),
    ),
    findOne: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    delete: jest.fn(),
  };
}

function createClinicSpecialtyRepositoryMock() {
  return {
    find: jest.fn().mockResolvedValue([]),
    delete: jest.fn(),
    insert: jest.fn(),
  };
}

function createCacheMock() {
  return {
    wrap: jest.fn((_key: string, loader: () => Promise<unknown>) => loader()),
    invalidate: jest.fn().mockResolvedValue(undefined),
  };
}

describe('SpecialtiesService', () => {
  const specialtyId = '11111111-1111-4111-8111-111111111111';
  const clinicId = '22222222-2222-4222-8222-222222222222';

  function createService() {
    const specialtyRepository = createSpecialtyRepositoryMock();
    const clinicSpecialtyRepository = createClinicSpecialtyRepositoryMock();
    const cache = createCacheMock();
    const service = new SpecialtiesService(
      specialtyRepository as any,
      clinicSpecialtyRepository as any,
      cache as any,
    );
    return { service, specialtyRepository, clinicSpecialtyRepository, cache };
  }

  describe('create (Add Specialty)', () => {
    it('should create a specialty and invalidate list caches', async () => {
      const { service, specialtyRepository, cache } = createService();
      specialtyRepository.findOne.mockResolvedValue(null);

      const result = await service.create({
        specialty_name: 'General Dentistry',
        specialty_code: 'GEN_DEN',
      } as any);

      expect(result).toEqual(
        expect.objectContaining({ specialty_name: 'General Dentistry' }),
      );
      expect(specialtyRepository.save).toHaveBeenCalled();
      expect(cache.invalidate).toHaveBeenCalledWith(
        'specialties:list:all',
        'specialties:list:active',
      );
    });

    it('should link provided clinic_ids to the new specialty', async () => {
      const { service, specialtyRepository, clinicSpecialtyRepository } =
        createService();
      specialtyRepository.findOne.mockResolvedValue(null);
      specialtyRepository.save.mockResolvedValue({
        specialty_id: specialtyId,
      });

      await service.create({
        specialty_name: 'Orthodontics',
        specialty_code: 'ORTHO',
        clinic_ids: [clinicId],
      } as any);

      expect(clinicSpecialtyRepository.delete).toHaveBeenCalledWith({
        specialty_id: specialtyId,
      });
      expect(clinicSpecialtyRepository.insert).toHaveBeenCalledWith([
        { clinic_id: clinicId, specialty_id: specialtyId },
      ]);
    });

    it('should reject creating a specialty with a duplicate name', async () => {
      const { service, specialtyRepository } = createService();
      specialtyRepository.findOne.mockResolvedValue({
        specialty_id: specialtyId,
        specialty_name: 'General Dentistry',
      });

      await expect(
        service.create({
          specialty_name: 'General Dentistry',
          specialty_code: 'GEN_DEN_2',
        } as any),
      ).rejects.toThrow(ConflictException);
      expect(specialtyRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll (View Specialty)', () => {
    it('should list all specialties by default', async () => {
      const { service, specialtyRepository, cache } = createService();
      specialtyRepository.find.mockResolvedValue([
        { specialty_id: specialtyId },
      ]);

      const result = await service.findAll();

      expect(cache.wrap).toHaveBeenCalledWith(
        'specialties:list:all',
        expect.any(Function),
      );
      expect(specialtyRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(result).toEqual([
        expect.objectContaining({ specialty_id: specialtyId, clinic_ids: [] }),
      ]);
    });

    it('should filter to active specialties only when requested', async () => {
      const { service, specialtyRepository, cache } = createService();
      specialtyRepository.find.mockResolvedValue([]);

      await service.findAll(true);

      expect(cache.wrap).toHaveBeenCalledWith(
        'specialties:list:active',
        expect.any(Function),
      );
      expect(specialtyRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { is_active: true } }),
      );
    });

    it('should attach linked clinic_ids to each specialty', async () => {
      const { service, specialtyRepository, clinicSpecialtyRepository } =
        createService();
      specialtyRepository.find.mockResolvedValue([
        { specialty_id: specialtyId },
      ]);
      clinicSpecialtyRepository.find.mockResolvedValue([
        { specialty_id: specialtyId, clinic_id: clinicId },
      ]);

      const result = await service.findAll();

      expect(result).toEqual([
        expect.objectContaining({
          specialty_id: specialtyId,
          clinic_ids: [clinicId],
        }),
      ]);
    });
  });

  describe('findById', () => {
    it('should return the specialty with its clinic_ids', async () => {
      const { service, specialtyRepository } = createService();
      specialtyRepository.findOne.mockResolvedValue({
        specialty_id: specialtyId,
      });

      const result = await service.findById(specialtyId);

      expect(specialtyRepository.findOne).toHaveBeenCalledWith({
        where: { specialty_id: specialtyId },
      });
      expect(result).toEqual(
        expect.objectContaining({ specialty_id: specialtyId, clinic_ids: [] }),
      );
    });

    it('should return null when specialty is missing', async () => {
      const { service, specialtyRepository } = createService();
      specialtyRepository.findOne.mockResolvedValue(null);

      const result = await service.findById(specialtyId);

      expect(result).toBeNull();
    });
  });

  describe('update (Update Specialty)', () => {
    it('should update specialty fields and invalidate caches', async () => {
      const { service, specialtyRepository, cache } = createService();
      specialtyRepository.findOne.mockResolvedValue({
        specialty_id: specialtyId,
        specialty_name: 'General Dentistry',
        is_active: true,
      });

      const result = await service.update(specialtyId, {
        is_active: false,
      } as any);

      expect(result).toEqual(
        expect.objectContaining({
          specialty_id: specialtyId,
          is_active: false,
        }),
      );
      expect(cache.invalidate).toHaveBeenCalledWith(
        'specialties:list:all',
        'specialties:list:active',
        `specialties:id:${specialtyId}`,
      );
    });

    it('should reject renaming to a name already used by another specialty', async () => {
      const { service, specialtyRepository } = createService();
      specialtyRepository.findOne
        .mockResolvedValueOnce({
          specialty_id: specialtyId,
          specialty_name: 'Old Name',
        })
        .mockResolvedValueOnce({
          specialty_id: 'other-id',
          specialty_name: 'Taken Name',
        });

      await expect(
        service.update(specialtyId, { specialty_name: 'Taken Name' } as any),
      ).rejects.toThrow(ConflictException);
      expect(specialtyRepository.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when specialty does not exist', async () => {
      const { service, specialtyRepository } = createService();
      specialtyRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(specialtyId, { is_active: false } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('should re-sync clinic_ids when provided', async () => {
      const { service, specialtyRepository, clinicSpecialtyRepository } =
        createService();
      specialtyRepository.findOne.mockResolvedValue({
        specialty_id: specialtyId,
        specialty_name: 'General Dentistry',
      });

      await service.update(specialtyId, {
        clinic_ids: [clinicId],
      } as any);

      expect(clinicSpecialtyRepository.delete).toHaveBeenCalledWith({
        specialty_id: specialtyId,
      });
      expect(clinicSpecialtyRepository.insert).toHaveBeenCalledWith([
        { clinic_id: clinicId, specialty_id: specialtyId },
      ]);
    });
  });

  describe('remove (Delete Specialty)', () => {
    it('should delete an existing specialty and invalidate caches', async () => {
      const { service, specialtyRepository, cache } = createService();
      specialtyRepository.findOne.mockResolvedValue({
        specialty_id: specialtyId,
      });

      await service.remove(specialtyId);

      expect(specialtyRepository.delete).toHaveBeenCalledWith({
        specialty_id: specialtyId,
      });
      expect(cache.invalidate).toHaveBeenCalledWith(
        'specialties:list:all',
        'specialties:list:active',
        `specialties:id:${specialtyId}`,
      );
    });

    it('should throw NotFoundException when removing a missing specialty', async () => {
      const { service, specialtyRepository } = createService();
      specialtyRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(specialtyId)).rejects.toThrow(
        NotFoundException,
      );
      expect(specialtyRepository.delete).not.toHaveBeenCalled();
    });
  });
});
