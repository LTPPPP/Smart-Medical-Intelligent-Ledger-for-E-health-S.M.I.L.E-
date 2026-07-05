import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { getMetadataArgsStorage } from 'typeorm';
import { CreateServiceDto } from '../services/dto/create-service.dto';
import { ServiceEntity } from '../services/entities/service.entity';
import { CreateTreatmentRoomDto } from '../treatment-rooms/dto/create-treatment-room.dto';
import { TreatmentRoomEntity } from '../treatment-rooms/entities/treatment-room.entity';
import { RoomType } from '../utils/enums/room-type.enum';

describe('service and treatment room scheduling contract', () => {
  it('should require a supported room type for every service', async () => {
    const missing = plainToInstance(CreateServiceDto, {
      service_code: 'CLEAN01',
      service_name: 'Cleaning',
    });
    const invalid = plainToInstance(CreateServiceDto, {
      service_code: 'CLEAN01',
      service_name: 'Cleaning',
      required_room_type: 'shared-room',
    });

    expect(await validate(missing)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'required_room_type' }),
      ]),
    );
    expect(await validate(invalid)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: 'required_room_type' }),
      ]),
    );
  });

  it('should accept normalized room types for services and rooms', async () => {
    const service = plainToInstance(CreateServiceDto, {
      service_code: 'XRAY01',
      service_name: 'Dental X-ray',
      required_room_type: RoomType.IMAGING,
    });
    const room = plainToInstance(CreateTreatmentRoomDto, {
      room_name: 'Imaging Room 1',
      room_code: 'IMG01',
      room_type: RoomType.IMAGING,
    });

    expect(await validate(service)).toHaveLength(0);
    expect(await validate(room)).toHaveLength(0);
  });

  it('should remove treatment room capacity from persistence metadata', () => {
    const roomColumns = getMetadataArgsStorage()
      .columns.filter((column) => column.target === TreatmentRoomEntity)
      .map((column) => column.propertyName);
    const serviceColumns = getMetadataArgsStorage()
      .columns.filter((column) => column.target === ServiceEntity)
      .map((column) => column.propertyName);

    expect(roomColumns).not.toContain('capacity');
    expect(serviceColumns).toContain('required_room_type');
  });
});
