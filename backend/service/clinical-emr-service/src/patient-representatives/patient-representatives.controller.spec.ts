import { PatientRepresentativesController } from './patient-representatives.controller';

const representativeId = '55555555-5555-4555-8555-555555555555';
const patientId = '33333333-3333-4333-8333-333333333333';
const actorId = '44444444-4444-4444-8444-444444444444';
const actor = (role?: string) => ({ accountId: actorId, role });

function createController() {
  const service = {
    create: jest.fn(),
    findByPatient: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    verify: jest.fn(),
  };

  return {
    controller: new PatientRepresentativesController(service as any),
    service,
  };
}

describe('PatientRepresentativesController', () => {
  it('should delegate representative routes with trusted actor context', () => {
    const { controller, service } = createController();
    const dto = {
      patient_id: patientId,
      full_name: 'Guardian',
      relationship: 'mother',
      phone: '0900000000',
      authorized_for_treatment: true,
    };
    service.create.mockReturnValue({ representative_id: representativeId });
    service.findByPatient.mockReturnValue([]);
    service.findOne.mockReturnValue({ representative_id: representativeId });
    service.update.mockReturnValue({ representative_id: representativeId });
    service.verify.mockReturnValue({ representative_id: representativeId });

    expect(controller.create(dto, actor('DOCTOR'))).toEqual({
      representative_id: representativeId,
    });
    expect(controller.findByPatient(patientId, actor('DOCTOR'))).toEqual([]);
    expect(controller.findOne(representativeId, actor('DOCTOR'))).toEqual({
      representative_id: representativeId,
    });
    expect(controller.update(representativeId, {}, actor('DOCTOR'))).toEqual({
      representative_id: representativeId,
    });
    expect(controller.verify(representativeId, actor('DOCTOR'))).toEqual({
      representative_id: representativeId,
    });

    expect(service.create).toHaveBeenCalledWith(dto, actorId, 'DOCTOR');
    expect(service.findByPatient).toHaveBeenCalledWith(
      patientId,
      actorId,
      'DOCTOR',
    );
    expect(service.findOne).toHaveBeenCalledWith(
      representativeId,
      actorId,
      'DOCTOR',
    );
    expect(service.update).toHaveBeenCalledWith(
      representativeId,
      {},
      actorId,
      'DOCTOR',
    );
    expect(service.verify).toHaveBeenCalledWith(
      representativeId,
      actorId,
      'DOCTOR',
    );
  });
});
