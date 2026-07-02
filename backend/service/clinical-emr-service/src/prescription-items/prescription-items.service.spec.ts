import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrescriptionItemsService } from './prescription-items.service';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn((value) => Promise.resolve(value)),
    remove: jest.fn(),
  };
}

describe('PrescriptionItemsService', () => {
  const itemId = '11111111-1111-4111-8111-111111111111';
  const prescriptionId = '22222222-2222-4222-8222-222222222222';

  function createService() {
    const prescriptionItemsRepository = createRepositoryMock();
    const prescriptionsRepository = createRepositoryMock();
    const service = new PrescriptionItemsService(
      prescriptionItemsRepository as any,
      prescriptionsRepository as any,
    );

    prescriptionsRepository.findOne.mockResolvedValue({
      prescription_id: prescriptionId,
      status: 'draft',
    });
    prescriptionItemsRepository.findOne.mockResolvedValue({
      item_id: itemId,
      prescription_id: prescriptionId,
      medication_name: 'Amoxicillin',
      dosage: '500mg',
      route: 'oral',
      frequency: 'BID',
      duration_days: 7,
      quantity: 14,
      instructions: 'Take after meals.',
    });

    return { service, prescriptionItemsRepository, prescriptionsRepository };
  }

  it('should adds medication items only to draft prescriptions', async () => {
    const { service, prescriptionItemsRepository } = createService();

    const result = await service.create({
      prescription_id: prescriptionId,
      medication_name: 'Amoxicillin',
      dosage: '500mg',
      route: 'oral',
      frequency: 'BID',
      duration_days: 7,
      quantity: 14,
      instructions: 'Take after meals.',
    });

    expect(result).toEqual(
      expect.objectContaining({
        prescription_id: prescriptionId,
        medication_name: 'Amoxicillin',
      }),
    );
    expect(prescriptionItemsRepository.save).toHaveBeenCalled();
  });

  it('should rejects adding medication items after prescription is issued', async () => {
    const { service, prescriptionItemsRepository, prescriptionsRepository } =
      createService();
    prescriptionsRepository.findOne.mockResolvedValue({
      prescription_id: prescriptionId,
      status: 'issued',
      issued_at: new Date(),
    });

    await expect(
      service.create({
        prescription_id: prescriptionId,
        medication_name: 'Amoxicillin',
        dosage: '500mg',
        route: 'oral',
        frequency: 'BID',
        duration_days: 7,
        quantity: 14,
        instructions: 'Take after meals.',
      }),
    ).rejects.toThrow(ConflictException);

    expect(prescriptionItemsRepository.save).not.toHaveBeenCalled();
  });

  it('should rejects adding medication items when the linked encounter is finalized', async () => {
    const { service, prescriptionItemsRepository, prescriptionsRepository } =
      createService();
    prescriptionsRepository.findOne.mockResolvedValue({
      prescription_id: prescriptionId,
      status: 'draft',
      session: {
        status: 'completed',
        signed_at: new Date(),
      },
    });

    await expect(
      service.create({
        prescription_id: prescriptionId,
        medication_name: 'Amoxicillin',
        dosage: '500mg',
        route: 'oral',
        frequency: 'BID',
        duration_days: 7,
        quantity: 14,
        instructions: 'Take after meals.',
      }),
    ).rejects.toThrow(ConflictException);

    expect(prescriptionItemsRepository.save).not.toHaveBeenCalled();
  });

  it('should rejects updating medication items after prescription is issued', async () => {
    const { service, prescriptionsRepository } = createService();
    prescriptionsRepository.findOne.mockResolvedValue({
      prescription_id: prescriptionId,
      status: 'issued',
      issued_at: new Date(),
    });

    await expect(service.update(itemId, { dosage: '250mg' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('should rejects deleting medication items after prescription is cancelled', async () => {
    const { service, prescriptionItemsRepository, prescriptionsRepository } =
      createService();
    prescriptionsRepository.findOne.mockResolvedValue({
      prescription_id: prescriptionId,
      status: 'cancelled',
      cancelled_at: new Date(),
    });

    await expect(service.remove(itemId)).rejects.toThrow(ConflictException);
    expect(prescriptionItemsRepository.remove).not.toHaveBeenCalled();
  });

  it('should rejects medication items for a missing prescription', async () => {
    const { service, prescriptionsRepository } = createService();
    prescriptionsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        prescription_id: prescriptionId,
        medication_name: 'Amoxicillin',
        dosage: '500mg',
        route: 'oral',
        frequency: 'BID',
        duration_days: 7,
        quantity: 14,
        instructions: 'Take after meals.',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should rejects medication items missing legally required dosing details', async () => {
    const { service, prescriptionItemsRepository } = createService();

    await expect(
      service.create({
        prescription_id: prescriptionId,
        medication_name: 'Amoxicillin',
        dosage: '500mg',
        frequency: 'BID',
        duration_days: 7,
        quantity: 14,
      } as any),
    ).rejects.toThrow(BadRequestException);

    expect(prescriptionItemsRepository.save).not.toHaveBeenCalled();
  });
});
