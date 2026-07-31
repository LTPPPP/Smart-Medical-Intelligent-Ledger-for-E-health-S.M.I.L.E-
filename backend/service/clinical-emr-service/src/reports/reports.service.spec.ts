import { BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';

function createQueryBuilderMock(rawResult: unknown) {
  const qb = {
    select: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rawResult),
    getRawOne: jest.fn().mockResolvedValue(rawResult),
  };

  return qb;
}

function createService() {
  const appointmentRepo = {
    createQueryBuilder: jest.fn(),
    find: jest.fn(),
  };
  const scheduleRepo = {
    find: jest.fn(),
  };
  const sessionRepo = {
    find: jest.fn(),
  };
  const treatmentPlanRepo = {
    find: jest.fn(),
  };

  const service = new ReportsService(
    appointmentRepo as any,
    scheduleRepo as any,
    sessionRepo as any,
    treatmentPlanRepo as any,
  );

  return {
    service,
    appointmentRepo,
    scheduleRepo,
    sessionRepo,
    treatmentPlanRepo,
  };
}

describe('ReportsService', () => {
  it('should summarize doctor performance rows', async () => {
    const { service, appointmentRepo } = createService();
    appointmentRepo.createQueryBuilder.mockReturnValue(
      createQueryBuilderMock([
        {
          doctor_id: 'doctor-1',
          total_appointments: '10',
          completed: '7',
          cancelled: '2',
          no_show: '1',
          in_care: '0',
          outside_hours: '3',
          unique_patients: '8',
          completion_rate_pct: '70.00',
          cancellation_rate_pct: '20.00',
          avg_duration_minutes: '30.00',
        },
      ]),
    );

    const report = await service.getDoctorPerformance({
      date_from: '2026-01-01',
      date_to: '2026-01-31',
    });

    expect(report.summary).toEqual({
      total_doctors: 1,
      total_appointments: 10,
      completed: 7,
      cancelled: 2,
      no_show: 1,
      completion_rate_pct: 70,
      cancellation_rate_pct: 20,
    });
    expect(report.doctors[0]).toMatchObject({
      doctor_id: 'doctor-1',
      total_appointments: 10,
      unique_patients: 8,
    });
  });

  it('should reject invalid report date ranges', async () => {
    const { service } = createService();

    await expect(
      service.getDoctorPerformance({
        date_from: '2026-02-01',
        date_to: '2026-01-01',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should build doctor dashboard summaries', async () => {
    const { service, appointmentRepo, scheduleRepo } = createService();
    appointmentRepo.createQueryBuilder
      .mockReturnValueOnce(
        createQueryBuilderMock({
          total: '4',
          pending: '1',
          confirmed: '2',
          completed: '1',
          cancelled: '0',
        }),
      )
      .mockReturnValueOnce(
        createQueryBuilderMock({
          total: '9',
          scheduled: '3',
          confirmed: '4',
          completed: '1',
          cancelled: '1',
          unique_patients: '6',
        }),
      );
    scheduleRepo.find.mockResolvedValue([
      { schedule_id: 'schedule-1', work_date: '2026-01-02' },
      { schedule_id: 'schedule-old', work_date: '2025-12-30' },
    ]);
    appointmentRepo.find.mockResolvedValue([
      { appointment_id: 'apt-1', appointment_date: '2026-01-02' },
      { appointment_id: 'apt-old', appointment_date: '2025-12-30' },
    ]);

    const dashboard = await service.getDoctorDashboard({
      doctor_id: 'doctor-1',
      date: '2026-01-01',
    });

    expect(dashboard.today_summary.total).toBe(4);
    expect(dashboard.seven_day_summary.unique_patients).toBe(6);
    expect(dashboard.upcoming_schedules).toHaveLength(1);
    expect(dashboard.upcoming_appointments).toHaveLength(1);
    expect(scheduleRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          doctor_id: 'doctor-1',
          work_date: expect.anything(),
        }),
      }),
    );
    expect(appointmentRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          doctor_id: 'doctor-1',
          appointment_date: expect.anything(),
        }),
      }),
    );
  });

  it('should build patient dashboard summary', async () => {
    const { service, appointmentRepo, treatmentPlanRepo, sessionRepo } =
      createService();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const future = futureDate.toISOString().slice(0, 10);

    appointmentRepo.find.mockResolvedValue([
      {
        appointment_id: 'apt-1',
        appointment_date: future,
        status: 'scheduled',
      },
      {
        appointment_id: 'apt-2',
        appointment_date: future,
        status: 'cancelled',
      },
    ]);
    treatmentPlanRepo.find.mockResolvedValue([{ plan_id: 'plan-1' }]);
    sessionRepo.find.mockResolvedValue([{ session_id: 'session-1' }]);

    const dashboard = await service.getPatientDashboard({
      patient_id: 'patient-1',
    });

    expect(dashboard.summary).toEqual({
      upcoming_appointments: 1,
      active_treatment_plans: 1,
      recent_sessions: 1,
    });
  });

  it('should reject customer dashboard requests without an identifier', async () => {
    const { service } = createService();

    await expect(service.getPatientDashboard({})).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should summarize financial report rows', async () => {
    const { service, appointmentRepo } = createService();
    appointmentRepo.createQueryBuilder.mockReturnValue(
      createQueryBuilderMock([
        {
          clinic_id: 'clinic-1',
          service_id: 'service-1',
          service_name: 'Consultation',
          currency: 'VND',
          total_appointments: '5',
          completed_appointments: '3',
          cancelled_appointments: '1',
          expected_revenue: '500000.00',
          collected_revenue: '300000.00',
          refunded_revenue: '0',
          outstanding_revenue: '200000.00',
        },
      ]),
    );

    const report = await service.getFinancialReport({
      date_from: '2026-01-01',
      date_to: '2026-01-31',
    });

    expect(report.summary).toMatchObject({
      total_appointments: 5,
      completed_appointments: 3,
      cancelled_appointments: 1,
      expected_revenue: 500000,
      collected_revenue: 300000,
      outstanding_revenue: 200000,
    });
    expect(report.rows[0].service_name).toBe('Consultation');
  });
});
