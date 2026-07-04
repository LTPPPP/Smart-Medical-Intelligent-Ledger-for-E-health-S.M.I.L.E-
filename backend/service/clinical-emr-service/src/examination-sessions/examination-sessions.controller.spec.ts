import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ExaminationSessionsController } from './examination-sessions.controller';
import { ExaminationSessionsService } from './examination-sessions.service';

describe('ExaminationSessionsController routes', () => {
  const appointmentId = '11111111-1111-4111-8111-111111111111';
  let app: INestApplication;
  const examinationSessionsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByPatientId: jest.fn(),
    findByDoctorId: jest.fn(),
    findByAppointmentId: jest.fn(),
    update: jest.fn(),
    finalize: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [ExaminationSessionsController],
      providers: [
        {
          provide: ExaminationSessionsService,
          useValue: examinationSessionsService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should route appointment lookup before the generic session id route', async () => {
    examinationSessionsService.findByAppointmentId.mockResolvedValue({
      session_id: '88888888-8888-4888-8888-888888888888',
      appointment_id: appointmentId,
    });

    await request(app.getHttpServer())
      .get(`/examination-sessions/appointment/${appointmentId}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.appointment_id).toBe(appointmentId);
      });

    expect(examinationSessionsService.findByAppointmentId).toHaveBeenCalledWith(
      appointmentId,
    );
    expect(examinationSessionsService.findOne).not.toHaveBeenCalled();
  });
});
