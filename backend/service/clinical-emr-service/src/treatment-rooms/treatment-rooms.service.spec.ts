import { NotFoundException } from '@nestjs/common';
import { TreatmentRoomsService } from './treatment-rooms.service';
import { RoomStatus } from '../utils/enums/room-status.enum';
import { RoomType } from '../utils/enums/room-type.enum';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    save: jest.fn((value) => Promise.resolve(value)),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    delete: jest.fn(),
  };
}

describe('TreatmentRoomsService', () => {
  const clinicId = '11111111-1111-4111-8111-111111111111';
  const roomId = '22222222-2222-4222-8222-222222222222';

  function createService() {
    const repository = createRepositoryMock();
    const service = new TreatmentRoomsService(repository as any);
    return { service, repository };
  }

  describe('create (Add Treatment Room)', () => {
    it('should create a treatment room scoped to the given clinic', async () => {
      const { service, repository } = createService();

      const result = await service.create(clinicId, {
        room_name: 'Examination Room 1',
        room_code: 'EXAM1',
        room_type: RoomType.EXAMINATION,
      } as any);

      expect(result).toEqual(
        expect.objectContaining({
          room_name: 'Examination Room 1',
          room_code: 'EXAM1',
          clinic_id: clinicId,
        }),
      );
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ clinic_id: clinicId }),
      );
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('findAllByClinic (View Treatment Room)', () => {
    it('should list rooms for a clinic with default paging', async () => {
      const { service, repository } = createService();
      repository.findAndCount.mockResolvedValue([[{ room_id: roomId }], 1]);

      const result = await service.findAllByClinic(clinicId, {} as any);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clinic_id: clinicId },
          skip: 0,
          take: 10,
        }),
      );
      expect(result).toEqual({ data: [{ room_id: roomId }], total: 1 });
    });

    it('should filter by room_type and status', async () => {
      const { service, repository } = createService();
      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAllByClinic(clinicId, {
        page: 2,
        limit: 5,
        room_type: RoomType.SURGERY,
        status: RoomStatus.OCCUPIED,
      } as any);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
          where: {
            clinic_id: clinicId,
            room_type: RoomType.SURGERY,
            status: RoomStatus.OCCUPIED,
          },
        }),
      );
    });

    it('should not leak rooms belonging to another clinic', async () => {
      const { service, repository } = createService();
      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAllByClinic(clinicId, {} as any);

      const callArgs = repository.findAndCount.mock.calls[0][0];
      expect(callArgs.where.clinic_id).toBe(clinicId);
    });
  });

  describe('findById', () => {
    it('should return the room with its clinic relation', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue({ room_id: roomId });

      const result = await service.findById(roomId);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { room_id: roomId },
        relations: ['clinic'],
      });
      expect(result).toEqual({ room_id: roomId });
    });

    it('should return null when room is missing', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue(null);

      const result = await service.findById(roomId);

      expect(result).toBeNull();
    });
  });

  describe('update (Update Treatment Room)', () => {
    it('should update room fields', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue({
        room_id: roomId,
        room_name: 'Old Name',
        status: RoomStatus.AVAILABLE,
      });

      const result = await service.update(roomId, {
        status: RoomStatus.MAINTENANCE,
      } as any);

      expect(result).toEqual(
        expect.objectContaining({
          room_id: roomId,
          status: RoomStatus.MAINTENANCE,
        }),
      );
    });

    it('should throw NotFoundException when room does not exist', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(roomId, { status: RoomStatus.MAINTENANCE } as any),
      ).rejects.toThrow(NotFoundException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove (Delete Treatment Room)', () => {
    it('should delete an existing room', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue({ room_id: roomId });

      await service.remove(roomId);

      expect(repository.delete).toHaveBeenCalledWith({ room_id: roomId });
    });

    it('should throw NotFoundException when removing a missing room', async () => {
      const { service, repository } = createService();
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(roomId)).rejects.toThrow(NotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
