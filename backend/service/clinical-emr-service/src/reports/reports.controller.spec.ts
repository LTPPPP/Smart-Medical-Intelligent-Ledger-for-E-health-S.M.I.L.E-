import { ReportsController } from './reports.controller';

describe('ReportsController', () => {
  const reportsService = {
    getDoctorPerformance: jest.fn(),
    getDoctorDashboard: jest.fn(),
    getPatientDashboard: jest.fn(),
    getFinancialReport: jest.fn(),
  };

  let controller: ReportsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ReportsController(reportsService as any);
  });

  it('should delegate doctor performance queries', () => {
    reportsService.getDoctorPerformance.mockReturnValue({ doctors: [] });

    expect(
      controller.getDoctorPerformance(
        '2026-01-01',
        '2026-01-31',
        'doctor-1',
        'clinic-1',
      ),
    ).toEqual({ doctors: [] });
    expect(reportsService.getDoctorPerformance).toHaveBeenCalledWith({
      doctor_id: 'doctor-1',
      clinic_id: 'clinic-1',
      date_from: '2026-01-01',
      date_to: '2026-01-31',
    });
  });

  it('should delegate doctor dashboard queries', () => {
    reportsService.getDoctorDashboard.mockReturnValue({
      doctor_id: 'doctor-1',
    });

    expect(controller.getDoctorDashboard('doctor-1', '2026-01-01')).toEqual({
      doctor_id: 'doctor-1',
    });
    expect(reportsService.getDoctorDashboard).toHaveBeenCalledWith({
      doctor_id: 'doctor-1',
      date: '2026-01-01',
    });
  });

  it('should delegate patient and customer dashboard queries with the actor', () => {
    const actor = { accountId: 'account-1', role: 'RECEPTIONIST' };
    reportsService.getPatientDashboard.mockReturnValue({ patient_id: 'p1' });

    expect(controller.getPatientDashboard(actor, 'p1')).toEqual({
      patient_id: 'p1',
    });
    expect(controller.getCustomerDashboard(actor, 'c1')).toEqual({
      patient_id: 'p1',
    });
    expect(controller.getCustomerDashboard(actor, undefined, 'p2')).toEqual({
      patient_id: 'p1',
    });
    expect(reportsService.getPatientDashboard).toHaveBeenNthCalledWith(
      1,
      { patient_id: 'p1' },
      actor,
    );
    expect(reportsService.getPatientDashboard).toHaveBeenNthCalledWith(
      2,
      { patient_id: 'c1' },
      actor,
    );
    expect(reportsService.getPatientDashboard).toHaveBeenNthCalledWith(
      3,
      { patient_id: 'p2' },
      actor,
    );
  });

  it('should delegate financial report queries', () => {
    reportsService.getFinancialReport.mockReturnValue({ rows: [] });

    expect(
      controller.getFinancialReport(
        '2026-01-01',
        '2026-01-31',
        'clinic-1',
        'doctor-1',
        'service-1',
      ),
    ).toEqual({ rows: [] });
    expect(reportsService.getFinancialReport).toHaveBeenCalledTimes(1);
    expect(reportsService.getFinancialReport).toHaveBeenLastCalledWith({
      date_from: '2026-01-01',
      date_to: '2026-01-31',
      clinic_id: 'clinic-1',
      doctor_id: 'doctor-1',
      service_id: 'service-1',
    });
  });
});
