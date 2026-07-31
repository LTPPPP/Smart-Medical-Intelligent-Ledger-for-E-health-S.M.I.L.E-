import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { DoctorScheduleEntity } from '../doctor-schedules/entities/doctor-schedule.entity';
import { ExaminationSessionEntity } from '../examination-sessions/entities/examination-session.entity';
import { TreatmentPlanEntity } from '../treatment-plans/entities/treatment-plan.entity';
import { PatientsService } from '../patients/patients.service';
import { Actor } from '../auth/actor.util';

const PAID_STATUSES = ['paid', 'completed', 'success', 'succeeded'];
// Roles allowed to pull up any patient's dashboard by id.
const STAFF_DASHBOARD_ROLES = new Set([
  'ADMIN',
  'MANAGER',
  'DOCTOR',
  'RECEPTIONIST',
  'NURSE',
]);
const ACTIVE_APPOINTMENT_STATUSES = [
  'scheduled',
  'confirmed',
  'checked_in',
  'in_progress',
  'completed',
];

export interface DoctorPerformanceQuery {
  doctor_id?: string;
  clinic_id?: string;
  date_from: string;
  date_to: string;
}

export interface DoctorDashboardQuery {
  doctor_id: string;
  date?: string;
}

export interface PatientDashboardQuery {
  patient_id?: string;
}

export interface FinancialReportQuery {
  clinic_id?: string;
  doctor_id?: string;
  service_id?: string;
  date_from: string;
  date_to: string;
}

export interface RevenueQuery {
  date_from: string;
  date_to: string;
  clinic_id?: string;
  group_by?: 'day' | 'service' | 'clinic';
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(AppointmentEntity, 'clinicConnection')
    private readonly appointmentRepo: Repository<AppointmentEntity>,
    @InjectRepository(DoctorScheduleEntity, 'clinicConnection')
    private readonly scheduleRepo: Repository<DoctorScheduleEntity>,
    @InjectRepository(ExaminationSessionEntity)
    private readonly sessionRepo: Repository<ExaminationSessionEntity>,
    @InjectRepository(TreatmentPlanEntity)
    private readonly treatmentPlanRepo: Repository<TreatmentPlanEntity>,
    private readonly patientsService: PatientsService,
  ) {}

  // UC-Doctor-Performance: Doctor performance report
  async getDoctorPerformance(query: DoctorPerformanceQuery) {
    const period = this.validateDateRange(query.date_from, query.date_to);
    const qb = this.appointmentRepo
      .createQueryBuilder('apt')
      .select([
        'apt.doctor_id AS doctor_id',
        'COUNT(apt.appointment_id) AS total_appointments',
        `SUM(CASE WHEN apt.status = 'completed' THEN 1 ELSE 0 END) AS completed`,
        `SUM(CASE WHEN apt.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled`,
        `SUM(CASE WHEN apt.status = 'no_show' THEN 1 ELSE 0 END) AS no_show`,
        `ROUND(
          SUM(CASE WHEN apt.status = 'completed' THEN 1 ELSE 0 END) * 100.0 /
          NULLIF(COUNT(apt.appointment_id), 0),
          2
        ) AS completion_rate_pct`,
        `ROUND(
          SUM(CASE WHEN apt.status = 'cancelled' THEN 1 ELSE 0 END) * 100.0 /
          NULLIF(COUNT(apt.appointment_id), 0),
          2
        ) AS cancellation_rate_pct`,
        'AVG(apt.duration_minutes) AS avg_duration_minutes',
        `SUM(CASE WHEN apt.status IN ('checked_in', 'in_progress') THEN 1 ELSE 0 END) AS in_care`,
        `SUM(CASE WHEN apt.is_outside_hours = true THEN 1 ELSE 0 END) AS outside_hours`,
        `COUNT(DISTINCT apt.patient_id) AS unique_patients`,
      ])
      .where('apt.appointment_date BETWEEN :date_from AND :date_to', {
        date_from: period.date_from,
        date_to: period.date_to,
      });

    if (query.doctor_id)
      qb.andWhere('apt.doctor_id = :doctor_id', { doctor_id: query.doctor_id });
    if (query.clinic_id)
      qb.andWhere('apt.clinic_id = :clinic_id', { clinic_id: query.clinic_id });

    qb.groupBy('apt.doctor_id').orderBy('total_appointments', 'DESC');

    const rows = (await qb.getRawMany()).map((row) => ({
      doctor_id: row.doctor_id,
      total_appointments: this.toNumber(row.total_appointments),
      completed: this.toNumber(row.completed),
      cancelled: this.toNumber(row.cancelled),
      no_show: this.toNumber(row.no_show),
      in_care: this.toNumber(row.in_care),
      outside_hours: this.toNumber(row.outside_hours),
      unique_patients: this.toNumber(row.unique_patients),
      completion_rate_pct: this.toNumber(row.completion_rate_pct),
      cancellation_rate_pct: this.toNumber(row.cancellation_rate_pct),
      avg_duration_minutes: this.toNumber(row.avg_duration_minutes),
    }));

    const totalAppointments = rows.reduce(
      (sum, row) => sum + row.total_appointments,
      0,
    );
    const completed = rows.reduce((sum, row) => sum + row.completed, 0);
    const cancelled = rows.reduce((sum, row) => sum + row.cancelled, 0);
    const noShow = rows.reduce((sum, row) => sum + row.no_show, 0);

    return {
      period,
      filters: {
        doctor_id: query.doctor_id ?? null,
        clinic_id: query.clinic_id ?? null,
      },
      summary: {
        total_doctors: rows.length,
        total_appointments: totalAppointments,
        completed,
        cancelled,
        no_show: noShow,
        completion_rate_pct: this.percentage(completed, totalAppointments),
        cancellation_rate_pct: this.percentage(cancelled, totalAppointments),
      },
      doctors: rows,
    };
  }

  // UC-Dashboard-Doctor: Doctor dashboard — today's appointments + upcoming 7-day schedule
  async getDoctorDashboard(query: DoctorDashboardQuery) {
    if (!query.doctor_id) {
      throw new BadRequestException('doctor_id is required');
    }

    const today = query.date ?? new Date().toISOString().split('T')[0];
    this.validateDate(today, 'date');
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const rangeEnd = sevenDaysLater.toISOString().split('T')[0];

    const todayStats = await this.appointmentRepo
      .createQueryBuilder('apt')
      .select([
        'COUNT(apt.appointment_id) AS total',
        `SUM(CASE WHEN apt.status = 'scheduled' THEN 1 ELSE 0 END) AS pending`,
        `SUM(CASE WHEN apt.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed`,
        `SUM(CASE WHEN apt.status = 'completed' THEN 1 ELSE 0 END) AS completed`,
        `SUM(CASE WHEN apt.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled`,
      ])
      .where('apt.doctor_id = :doctor_id', { doctor_id: query.doctor_id })
      .andWhere('apt.appointment_date = :today', { today })
      .getRawOne();

    const sevenDayStats = await this.appointmentRepo
      .createQueryBuilder('apt')
      .select([
        'COUNT(apt.appointment_id) AS total',
        `SUM(CASE WHEN apt.status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled`,
        `SUM(CASE WHEN apt.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed`,
        `SUM(CASE WHEN apt.status = 'completed' THEN 1 ELSE 0 END) AS completed`,
        `SUM(CASE WHEN apt.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled`,
        `COUNT(DISTINCT apt.patient_id) AS unique_patients`,
      ])
      .where('apt.doctor_id = :doctor_id', { doctor_id: query.doctor_id })
      .andWhere('apt.appointment_date BETWEEN :today AND :rangeEnd', {
        today,
        rangeEnd,
      })
      .getRawOne();

    const upcomingSchedules = await this.scheduleRepo.find({
      where: { doctor_id: query.doctor_id },
      order: { work_date: 'ASC' },
      relations: ['clinic', 'shift', 'room'],
    });

    const upcomingAppointments = await this.appointmentRepo.find({
      where: { doctor_id: query.doctor_id },
      relations: ['clinic', 'service'],
      order: { appointment_date: 'ASC', appointment_time: 'ASC' },
      take: 20,
    });

    return {
      doctor_id: query.doctor_id,
      date: today,
      range: { date_from: today, date_to: rangeEnd },
      today_summary: this.normalizeStats(todayStats, [
        'total',
        'pending',
        'confirmed',
        'completed',
        'cancelled',
      ]),
      seven_day_summary: this.normalizeStats(sevenDayStats, [
        'total',
        'scheduled',
        'confirmed',
        'completed',
        'cancelled',
        'unique_patients',
      ]),
      upcoming_schedules: upcomingSchedules.filter((s) => {
        const d =
          s.work_date instanceof Date
            ? s.work_date.toISOString().split('T')[0]
            : s.work_date;
        return d >= today && d <= rangeEnd;
      }),
      upcoming_appointments: upcomingAppointments.filter((a) => {
        const d =
          a.appointment_date instanceof Date
            ? a.appointment_date.toISOString().split('T')[0]
            : a.appointment_date;
        return d >= today;
      }),
    };
  }

  // UC-Revenue-Report: Revenue / financial report aggregated from paid appointments
  async getRevenue(query: RevenueQuery) {
    const period = { date_from: query.date_from, date_to: query.date_to };

    // Base builder: paid appointments in range, joined to services for price.
    // Appointments, services and clinics all live on 'clinicConnection',
    // so a SQL join is safe here.
    const baseBuilder = () => {
      const qb = this.appointmentRepo
        .createQueryBuilder('apt')
        .leftJoin('apt.service', 'svc')
        .leftJoin('apt.clinic', 'clinic')
        .where("apt.payment_status = 'paid'")
        .andWhere('apt.appointment_date BETWEEN :date_from AND :date_to', {
          date_from: query.date_from,
          date_to: query.date_to,
        });
      if (query.clinic_id)
        qb.andWhere('apt.clinic_id = :clinic_id', {
          clinic_id: query.clinic_id,
        });
      return qb;
    };

    const toNum = (v: unknown): number => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    // Totals
    const totalsRow = await baseBuilder()
      .select([
        'COALESCE(SUM(svc.base_price), 0) AS total_revenue',
        'COUNT(apt.appointment_id) AS paid_count',
      ])
      .getRawOne<{ total_revenue: string; paid_count: string }>();

    const totals = {
      total_revenue: toNum(totalsRow?.total_revenue),
      paid_count: toNum(totalsRow?.paid_count),
      currency: 'VND' as const,
      period,
    };

    // Group by day
    const byDayRows = await baseBuilder()
      .select([
        'apt.appointment_date AS date',
        'COALESCE(SUM(svc.base_price), 0) AS revenue',
        'COUNT(apt.appointment_id) AS count',
      ])
      .groupBy('apt.appointment_date')
      .orderBy('apt.appointment_date', 'ASC')
      .getRawMany<{ date: string | Date; revenue: string; count: string }>();

    const by_day = byDayRows.map((r) => ({
      date:
        r.date instanceof Date
          ? r.date.toISOString().split('T')[0]
          : String(r.date),
      revenue: toNum(r.revenue),
      count: toNum(r.count),
    }));

    // Group by service
    const byServiceRows = await baseBuilder()
      .select([
        'apt.service_id AS service_id',
        'svc.service_name AS service_name',
        'COALESCE(SUM(svc.base_price), 0) AS revenue',
        'COUNT(apt.appointment_id) AS count',
      ])
      .groupBy('apt.service_id')
      .addGroupBy('svc.service_name')
      .orderBy('revenue', 'DESC')
      .getRawMany<{
        service_id: string | null;
        service_name: string | null;
        revenue: string;
        count: string;
      }>();

    const by_service = byServiceRows.map((r) => ({
      service_id: r.service_id,
      service_name: r.service_name ?? 'Unknown',
      revenue: toNum(r.revenue),
      count: toNum(r.count),
    }));

    // Group by clinic
    const byClinicRows = await baseBuilder()
      .select([
        'apt.clinic_id AS clinic_id',
        'clinic.clinic_name AS clinic_name',
        'COALESCE(SUM(svc.base_price), 0) AS revenue',
        'COUNT(apt.appointment_id) AS count',
      ])
      .groupBy('apt.clinic_id')
      .addGroupBy('clinic.clinic_name')
      .orderBy('revenue', 'DESC')
      .getRawMany<{
        clinic_id: string | null;
        clinic_name: string | null;
        revenue: string;
        count: string;
      }>();

    const by_clinic = byClinicRows.map((r) => ({
      clinic_id: r.clinic_id,
      clinic_name: r.clinic_name ?? 'Unknown',
      revenue: toNum(r.revenue),
      count: toNum(r.count),
    }));

    // Refunds (K9): appointments moved to `refunded` by the payment service.
    // Reported separately and subtracted from gross to give net revenue.
    const refundBuilder = this.appointmentRepo
      .createQueryBuilder('apt')
      .leftJoin('apt.service', 'svc')
      .where("apt.payment_status = 'refunded'")
      .andWhere('apt.appointment_date BETWEEN :date_from AND :date_to', {
        date_from: query.date_from,
        date_to: query.date_to,
      });
    if (query.clinic_id)
      refundBuilder.andWhere('apt.clinic_id = :clinic_id', {
        clinic_id: query.clinic_id,
      });

    const refundRow = await refundBuilder
      .select([
        'COALESCE(SUM(svc.base_price), 0) AS refunded_amount',
        'COUNT(apt.appointment_id) AS refunded_count',
      ])
      .getRawOne<{ refunded_amount: string; refunded_count: string }>();

    const refunds = {
      refunded_amount: toNum(refundRow?.refunded_amount),
      refunded_count: toNum(refundRow?.refunded_count),
    };

    return {
      group_by: query.group_by ?? 'day',
      totals: {
        ...totals,
        ...refunds,
        net_revenue: totals.total_revenue - refunds.refunded_amount,
      },
      by_day,
      by_service,
      by_clinic,
    };
  }

  // UC-Operational-Report (K9): appointment volume and outcome rates across the
  // whole clinic network (or a single clinic) — the operational counterpart to
  // the revenue report.
  async getOperationalReport(query: RevenueQuery) {
    const qb = this.appointmentRepo
      .createQueryBuilder('apt')
      .select([
        'COUNT(apt.appointment_id) AS total',
        `SUM(CASE WHEN apt.status = 'completed' THEN 1 ELSE 0 END) AS completed`,
        `SUM(CASE WHEN apt.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled`,
        `SUM(CASE WHEN apt.status = 'no_show' THEN 1 ELSE 0 END) AS no_show`,
        `SUM(CASE WHEN apt.status IN ('scheduled', 'confirmed') THEN 1 ELSE 0 END) AS upcoming`,
        `ROUND(
          SUM(CASE WHEN apt.status = 'no_show' THEN 1 ELSE 0 END) * 100.0 /
          NULLIF(COUNT(apt.appointment_id), 0), 2) AS no_show_rate_pct`,
        `ROUND(
          SUM(CASE WHEN apt.status = 'cancelled' THEN 1 ELSE 0 END) * 100.0 /
          NULLIF(COUNT(apt.appointment_id), 0), 2) AS cancellation_rate_pct`,
        `ROUND(
          SUM(CASE WHEN apt.status = 'completed' THEN 1 ELSE 0 END) * 100.0 /
          NULLIF(COUNT(apt.appointment_id), 0), 2) AS completion_rate_pct`,
      ])
      .where('apt.appointment_date BETWEEN :date_from AND :date_to', {
        date_from: query.date_from,
        date_to: query.date_to,
      });
    if (query.clinic_id)
      qb.andWhere('apt.clinic_id = :clinic_id', { clinic_id: query.clinic_id });

    const summary = await qb.getRawOne();

    return {
      period: { date_from: query.date_from, date_to: query.date_to },
      summary,
    };
  }

  // A PATIENT may only ever see their own dashboard; staff may look up any
  // patient explicitly. The caller-supplied id is never trusted on its own.
  private async resolveDashboardPatientId(
    query: PatientDashboardQuery,
    actor: Actor,
  ): Promise<string> {
    const isStaff = STAFF_DASHBOARD_ROLES.has(
      actor.role?.trim().toUpperCase() ?? '',
    );

    if (isStaff) {
      if (!query.patient_id) {
        throw new BadRequestException('patient_id or customer_id is required');
      }
      return query.patient_id;
    }

    const ownPatient = await this.patientsService.findByUserId(actor.accountId);
    if (!ownPatient) {
      throw new ForbiddenException('No patient record for this account');
    }
    if (query.patient_id && query.patient_id !== ownPatient.patient_id) {
      throw new ForbiddenException(
        'You may only view your own patient dashboard',
      );
    }
    return ownPatient.patient_id;
  }

  // UC-Dashboard-Patient: Patient dashboard — upcoming appointments, active plans, recent sessions
  async getPatientDashboard(query: PatientDashboardQuery, actor: Actor) {
    const patientId = await this.resolveDashboardPatientId(query, actor);

    const today = new Date().toISOString().split('T')[0];

    const upcomingAppointments = await this.appointmentRepo.find({
      where: { patient_id: patientId },
      relations: ['clinic', 'service'],
      order: { appointment_date: 'ASC', appointment_time: 'ASC' },
      take: 10,
    });

    const activeTreatmentPlans = await this.treatmentPlanRepo.find({
      where: { patient_id: patientId, status: 'active' as any },
      order: { created_at: 'DESC' },
      take: 5,
    });

    const recentSessions = await this.sessionRepo.find({
      where: { patient_id: patientId },
      order: { created_at: 'DESC' },
      take: 5,
    });

    const filteredAppointments = upcomingAppointments.filter((a) => {
      const d =
        a.appointment_date instanceof Date
          ? a.appointment_date.toISOString().split('T')[0]
          : a.appointment_date;
      return d >= today && ['scheduled', 'confirmed'].includes(a.status);
    });

    return {
      patient_id: patientId,
      summary: {
        upcoming_appointments: filteredAppointments.length,
        active_treatment_plans: activeTreatmentPlans.length,
        recent_sessions: recentSessions.length,
      },
      upcoming_appointments: filteredAppointments,
      active_treatment_plans: activeTreatmentPlans,
      recent_sessions: recentSessions,
    };
  }

  // UC-Financial-Report: estimated revenue report from appointment services.
  async getFinancialReport(query: FinancialReportQuery) {
    const period = this.validateDateRange(query.date_from, query.date_to);
    const qb = this.appointmentRepo
      .createQueryBuilder('apt')
      .leftJoin('apt.service', 'svc')
      .select([
        'apt.clinic_id AS clinic_id',
        'apt.service_id AS service_id',
        'svc.service_name AS service_name',
        'svc.currency AS currency',
        'COUNT(apt.appointment_id) AS total_appointments',
        `SUM(CASE WHEN apt.status = 'completed' THEN 1 ELSE 0 END) AS completed_appointments`,
        `SUM(CASE WHEN apt.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_appointments`,
        `SUM(CASE WHEN apt.status IN (:...activeStatuses) THEN COALESCE(svc.base_price, 0) ELSE 0 END) AS expected_revenue`,
        `SUM(CASE WHEN apt.payment_status IN (:...paidStatuses) THEN COALESCE(svc.base_price, 0) ELSE 0 END) AS collected_revenue`,
        `SUM(CASE WHEN apt.payment_status = 'refunded' THEN COALESCE(svc.base_price, 0) ELSE 0 END) AS refunded_revenue`,
        `SUM(CASE WHEN apt.payment_status NOT IN (:...paidStatuses) AND apt.status <> 'cancelled' THEN COALESCE(svc.base_price, 0) ELSE 0 END) AS outstanding_revenue`,
      ])
      .where('apt.appointment_date BETWEEN :date_from AND :date_to', {
        date_from: period.date_from,
        date_to: period.date_to,
      })
      .setParameters({
        paidStatuses: PAID_STATUSES,
        activeStatuses: ACTIVE_APPOINTMENT_STATUSES,
      });

    if (query.clinic_id) {
      qb.andWhere('apt.clinic_id = :clinic_id', { clinic_id: query.clinic_id });
    }
    if (query.doctor_id) {
      qb.andWhere('apt.doctor_id = :doctor_id', { doctor_id: query.doctor_id });
    }
    if (query.service_id) {
      qb.andWhere('apt.service_id = :service_id', {
        service_id: query.service_id,
      });
    }

    qb.groupBy('apt.clinic_id')
      .addGroupBy('apt.service_id')
      .addGroupBy('svc.service_name')
      .addGroupBy('svc.currency')
      .orderBy('expected_revenue', 'DESC');

    const rows = (await qb.getRawMany()).map((row) => ({
      clinic_id: row.clinic_id,
      service_id: row.service_id,
      service_name: row.service_name,
      currency: row.currency ?? 'VND',
      total_appointments: this.toNumber(row.total_appointments),
      completed_appointments: this.toNumber(row.completed_appointments),
      cancelled_appointments: this.toNumber(row.cancelled_appointments),
      expected_revenue: this.toNumber(row.expected_revenue),
      collected_revenue: this.toNumber(row.collected_revenue),
      refunded_revenue: this.toNumber(row.refunded_revenue),
      outstanding_revenue: this.toNumber(row.outstanding_revenue),
    }));

    return {
      period,
      filters: {
        clinic_id: query.clinic_id ?? null,
        doctor_id: query.doctor_id ?? null,
        service_id: query.service_id ?? null,
      },
      summary: {
        total_appointments: rows.reduce(
          (sum, row) => sum + row.total_appointments,
          0,
        ),
        completed_appointments: rows.reduce(
          (sum, row) => sum + row.completed_appointments,
          0,
        ),
        cancelled_appointments: rows.reduce(
          (sum, row) => sum + row.cancelled_appointments,
          0,
        ),
        expected_revenue: rows.reduce(
          (sum, row) => sum + row.expected_revenue,
          0,
        ),
        collected_revenue: rows.reduce(
          (sum, row) => sum + row.collected_revenue,
          0,
        ),
        refunded_revenue: rows.reduce(
          (sum, row) => sum + row.refunded_revenue,
          0,
        ),
        outstanding_revenue: rows.reduce(
          (sum, row) => sum + row.outstanding_revenue,
          0,
        ),
      },
      rows,
    };
  }

  private validateDateRange(dateFrom?: string, dateTo?: string) {
    const from = this.validateDate(dateFrom, 'date_from');
    const to = this.validateDate(dateTo, 'date_to');

    if (from > to) {
      throw new BadRequestException(
        'date_from must be before or equal date_to',
      );
    }

    return { date_from: from, date_to: to };
  }

  private validateDate(value: string | undefined, fieldName: string) {
    if (!value) {
      throw new BadRequestException(`${fieldName} is required`);
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(`${fieldName} must use YYYY-MM-DD format`);
    }

    const date = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException(`${fieldName} is not a valid date`);
    }

    return value;
  }

  private toNumber(value: unknown): number {
    if (value === null || value === undefined) return 0;
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  private percentage(value: number, total: number): number {
    if (!total) return 0;
    return Math.round((value * 10000) / total) / 100;
  }

  private normalizeStats(
    row: Record<string, unknown> | undefined,
    fields: string[],
  ) {
    return fields.reduce<Record<string, number>>((result, field) => {
      result[field] = this.toNumber(row?.[field]);
      return result;
    }, {});
  }
}
