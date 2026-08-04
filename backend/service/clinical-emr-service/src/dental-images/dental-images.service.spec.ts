import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { DentalImagesService } from './dental-images.service';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn((value) => Promise.resolve(value)),
    remove: jest.fn(),
  };
}

describe('DentalImagesService', () => {
  const imageId = '11111111-1111-4111-8111-111111111111';
  const patientId = '22222222-2222-4222-8222-222222222222';
  const recordId = '33333333-3333-4333-8333-333333333333';
  const uploaderId = '44444444-4444-4444-8444-444444444444';

  function createService() {
    const dentalImagesRepository = createRepositoryMock();
    const medicalRecordsRepository = createRepositoryMock();
    const service = new DentalImagesService(
      dentalImagesRepository as any,
      medicalRecordsRepository as any,
    );

    medicalRecordsRepository.findOne.mockResolvedValue({
      record_id: recordId,
      patient_id: patientId,
      record_status: 'draft',
      finalized_at: null,
    });

    return { service, dentalImagesRepository, medicalRecordsRepository };
  }

  function createImage(overrides = {}) {
    return {
      patient_id: patientId,
      record_id: recordId,
      image_type: 'xray',
      image_url: 'dental-images/patient-222/xray.png',
      uploaded_by: uploaderId,
      ...overrides,
    };
  }

  it('should create a record-linked dental image when patient matches a mutable record', async () => {
    const { service, dentalImagesRepository } = createService();

    const result = await service.create(createImage());

    expect(result).toEqual(
      expect.objectContaining({
        patient_id: patientId,
        record_id: recordId,
        image_type: 'xray',
        uploaded_by: uploaderId,
      }),
    );
    expect(dentalImagesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        patient_id: patientId,
        record_id: recordId,
      }),
    );
  });

  it('should allow creating a standalone dental image without a medical record', async () => {
    const { service, dentalImagesRepository, medicalRecordsRepository } =
      createService();

    const result = await service.create(
      createImage({
        record_id: undefined,
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        patient_id: patientId,
        record_id: undefined,
      }),
    );
    expect(medicalRecordsRepository.findOne).not.toHaveBeenCalled();
    expect(dentalImagesRepository.save).toHaveBeenCalled();
  });

  it('should reject creating a dental image when patient does not match the linked record', async () => {
    const { service, dentalImagesRepository } = createService();

    await expect(
      service.create(
        createImage({
          patient_id: '55555555-5555-4555-8555-555555555555',
        }),
      ),
    ).rejects.toThrow(BadRequestException);

    expect(dentalImagesRepository.save).not.toHaveBeenCalled();
  });

  it('should reject public dental image URLs because clinical images must stay private', async () => {
    const { service, dentalImagesRepository } = createService();

    await expect(
      service.create(
        createImage({
          image_url: 'https://example.test/xray.png',
        }),
      ),
    ).rejects.toThrow(BadRequestException);

    expect(dentalImagesRepository.save).not.toHaveBeenCalled();
  });

  it('should reject creating a dental image for a finalized record', async () => {
    const { service, dentalImagesRepository, medicalRecordsRepository } =
      createService();
    medicalRecordsRepository.findOne.mockResolvedValue({
      record_id: recordId,
      patient_id: patientId,
      record_status: 'finalized',
      finalized_at: new Date(),
    });

    await expect(service.create(createImage())).rejects.toThrow(
      ConflictException,
    );

    expect(dentalImagesRepository.save).not.toHaveBeenCalled();
  });

  it('should reject updating a record-linked dental image after its record is finalized', async () => {
    const { service, dentalImagesRepository, medicalRecordsRepository } =
      createService();
    dentalImagesRepository.findOne.mockResolvedValue({
      image_id: imageId,
      ...createImage(),
    });
    medicalRecordsRepository.findOne.mockResolvedValue({
      record_id: recordId,
      patient_id: patientId,
      record_status: 'signed',
      finalized_at: new Date(),
    });

    await expect(
      service.update(imageId, { description: 'Updated finding' }),
    ).rejects.toThrow(ConflictException);

    expect(dentalImagesRepository.save).not.toHaveBeenCalled();
  });

  it('should reject changing dental image patient, record, uploader, or image URL context', async () => {
    const { service, dentalImagesRepository } = createService();
    dentalImagesRepository.findOne.mockResolvedValue({
      image_id: imageId,
      ...createImage(),
    });

    await expect(
      service.update(imageId, {
        record_id: '66666666-6666-4666-8666-666666666666',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(dentalImagesRepository.save).not.toHaveBeenCalled();
  });

  it('should reject deleting a record-linked dental image after its record is finalized', async () => {
    const { service, dentalImagesRepository, medicalRecordsRepository } =
      createService();
    dentalImagesRepository.findOne.mockResolvedValue({
      image_id: imageId,
      ...createImage(),
    });
    medicalRecordsRepository.findOne.mockResolvedValue({
      record_id: recordId,
      patient_id: patientId,
      record_status: 'completed',
      finalized_at: new Date(),
    });

    await expect(service.remove(imageId)).rejects.toThrow(ConflictException);

    expect(dentalImagesRepository.remove).not.toHaveBeenCalled();
  });

  it('should reject archiving a record-linked dental image after its record is finalized', async () => {
    const { service, dentalImagesRepository, medicalRecordsRepository } =
      createService();
    dentalImagesRepository.findOne.mockResolvedValue({
      image_id: imageId,
      ...createImage({
        is_archived: false,
      }),
    });
    medicalRecordsRepository.findOne.mockResolvedValue({
      record_id: recordId,
      patient_id: patientId,
      record_status: 'finalized',
      finalized_at: new Date(),
    });

    await expect(service.archive(imageId)).rejects.toThrow(ConflictException);

    expect(dentalImagesRepository.save).not.toHaveBeenCalled();
  });

  it('should throw not found when the linked record is missing', async () => {
    const { service, medicalRecordsRepository } = createService();
    medicalRecordsRepository.findOne.mockResolvedValue(null);

    await expect(service.create(createImage())).rejects.toThrow(
      NotFoundException,
    );
  });

  describe('View Dental Image Library', () => {
    it('should list all dental images', async () => {
      const { service, dentalImagesRepository } = createService();
      dentalImagesRepository.find.mockResolvedValue([{ image_id: imageId }]);

      const result = await service.findAll();

      expect(result).toEqual([{ image_id: imageId }]);
    });

    it("should list a patient's dental images", async () => {
      const { service, dentalImagesRepository } = createService();
      dentalImagesRepository.find.mockResolvedValue([{ image_id: imageId }]);

      const result = await service.findByPatientId(patientId);

      expect(dentalImagesRepository.find).toHaveBeenCalledWith({
        where: { patient_id: patientId },
      });
      expect(result).toEqual([{ image_id: imageId }]);
    });

    it('should list dental images by category', async () => {
      const { service, dentalImagesRepository } = createService();
      const categoryId = '55555555-5555-4555-8555-555555555555';
      dentalImagesRepository.find.mockResolvedValue([{ image_id: imageId }]);

      const result = await service.findByCategoryId(categoryId);

      expect(dentalImagesRepository.find).toHaveBeenCalledWith({
        where: { category_id: categoryId },
      });
      expect(result).toEqual([{ image_id: imageId }]);
    });

    it('should list archived dental images', async () => {
      const { service, dentalImagesRepository } = createService();
      dentalImagesRepository.find.mockResolvedValue([
        { image_id: imageId, is_archived: true },
      ]);

      const result = await service.findArchived();

      expect(dentalImagesRepository.find).toHaveBeenCalledWith({
        where: { is_archived: true },
      });
      expect(result).toEqual([expect.objectContaining({ is_archived: true })]);
    });
  });
});
