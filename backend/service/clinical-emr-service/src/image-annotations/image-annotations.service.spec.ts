import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ImageAnnotationsService } from './image-annotations.service';

function createRepositoryMock() {
  return {
    create: jest.fn((value) => ({ ...value })),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn((value) => Promise.resolve(value)),
    remove: jest.fn(),
  };
}

describe('ImageAnnotationsService', () => {
  const annotationId = '11111111-1111-4111-8111-111111111111';
  const imageId = '22222222-2222-4222-8222-222222222222';
  const recordId = '33333333-3333-4333-8333-333333333333';
  const doctorId = '44444444-4444-4444-8444-444444444444';

  function createService() {
    const annotationsRepository = createRepositoryMock();
    const dentalImagesRepository = createRepositoryMock();
    const medicalRecordsRepository = createRepositoryMock();
    const service = new ImageAnnotationsService(
      annotationsRepository as any,
      dentalImagesRepository as any,
      medicalRecordsRepository as any,
    );

    dentalImagesRepository.findOne.mockResolvedValue({
      image_id: imageId,
      record_id: recordId,
      is_archived: false,
    });
    medicalRecordsRepository.findOne.mockResolvedValue({
      record_id: recordId,
      record_status: 'draft',
      finalized_at: null,
    });

    return {
      service,
      annotationsRepository,
      dentalImagesRepository,
      medicalRecordsRepository,
    };
  }

  function createAnnotation(overrides = {}) {
    return {
      image_id: imageId,
      annotated_by: doctorId,
      annotation_type: 'finding',
      annotation_data: { tooth: 11 },
      note: 'Caries suspected',
      ...overrides,
    };
  }

  it('should reject creating an annotation for a missing dental image', async () => {
    const { service, annotationsRepository, dentalImagesRepository } =
      createService();
    dentalImagesRepository.findOne.mockResolvedValue(null);

    await expect(service.create(createAnnotation())).rejects.toThrow(
      NotFoundException,
    );

    expect(annotationsRepository.save).not.toHaveBeenCalled();
  });

  it('should reject creating an annotation for an archived dental image', async () => {
    const { service, annotationsRepository, dentalImagesRepository } =
      createService();
    dentalImagesRepository.findOne.mockResolvedValue({
      image_id: imageId,
      record_id: recordId,
      is_archived: true,
    });

    await expect(service.create(createAnnotation())).rejects.toThrow(
      ConflictException,
    );

    expect(annotationsRepository.save).not.toHaveBeenCalled();
  });

  it('should reject creating an annotation when the linked record is finalized', async () => {
    const { service, annotationsRepository, medicalRecordsRepository } =
      createService();
    medicalRecordsRepository.findOne.mockResolvedValue({
      record_id: recordId,
      record_status: 'finalized',
      finalized_at: new Date(),
    });

    await expect(service.create(createAnnotation())).rejects.toThrow(
      ConflictException,
    );

    expect(annotationsRepository.save).not.toHaveBeenCalled();
  });

  it('should create an annotation for a mutable dental image', async () => {
    const { service, annotationsRepository } = createService();

    const result = await service.create(createAnnotation());

    expect(result).toEqual(
      expect.objectContaining({
        image_id: imageId,
        annotated_by: doctorId,
        annotation_type: 'finding',
      }),
    );
    expect(annotationsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        image_id: imageId,
        annotated_by: doctorId,
      }),
    );
  });

  it('should reject updating an annotation after its image record is finalized', async () => {
    const { service, annotationsRepository, medicalRecordsRepository } =
      createService();
    annotationsRepository.findOne.mockResolvedValue({
      annotation_id: annotationId,
      image_id: imageId,
      annotated_by: doctorId,
      note: 'Initial note',
    });
    medicalRecordsRepository.findOne.mockResolvedValue({
      record_id: recordId,
      record_status: 'signed',
      finalized_at: new Date(),
    });

    await expect(
      service.update(annotationId, { note: 'Updated note' }),
    ).rejects.toThrow(ConflictException);

    expect(annotationsRepository.save).not.toHaveBeenCalled();
  });

  it('should reject changing annotation image or author context', async () => {
    const { service, annotationsRepository } = createService();
    annotationsRepository.findOne.mockResolvedValue({
      annotation_id: annotationId,
      image_id: imageId,
      annotated_by: doctorId,
      note: 'Initial note',
    });

    await expect(
      service.update(annotationId, {
        image_id: '55555555-5555-4555-8555-555555555555',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(annotationsRepository.save).not.toHaveBeenCalled();
  });

  it('should reject deleting an annotation after its image is archived', async () => {
    const { service, annotationsRepository, dentalImagesRepository } =
      createService();
    annotationsRepository.findOne.mockResolvedValue({
      annotation_id: annotationId,
      image_id: imageId,
      annotated_by: doctorId,
    });
    dentalImagesRepository.findOne.mockResolvedValue({
      image_id: imageId,
      record_id: recordId,
      is_archived: true,
    });

    await expect(service.remove(annotationId)).rejects.toThrow(
      ConflictException,
    );

    expect(annotationsRepository.remove).not.toHaveBeenCalled();
  });
});
