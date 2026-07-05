import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentEntity } from '../appointments/entities/appointment.entity';
import { DoctorScheduleEntity } from '../doctor-schedules/entities/doctor-schedule.entity';
import { ExaminationSessionEntity } from '../examination-sessions/entities/examination-session.entity';
import { TreatmentPlanEntity } from '../treatment-plans/entities/treatment-plan.entity';

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
  patient_id: string;
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
  ) {}

  // UC-Doctor-Performance: Doctor performance report
  async getDoctorPerformance(query: DoctorPerformanceQuery) {
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
      ])
      .where('apt.appointment_date BETWEEN :date_from AND :date_to', {
        date_from: query.date_from,
        date_to: query.date_to,
      });

    if (query.doctor_id)
      qb.andWhere('apt.doctor_id = :doctor_id', { doctor_id: query.doctor_id });
    if (query.clinic_id)
      qb.andWhere('apt.clinic_id = :clinic_id', { clinic_id: query.clinic_id });

    qb.groupBy('apt.doctor_id').orderBy('total_appointments', 'DESC');

    const rows = await qb.getRawMany();
    return {
      period: { date_from: query.date_from, date_to: query.date_to },
      doctors: rows,
    };
  }

  // UC-Dashboard-Doctor: Doctor dashboard — today's appointments + upcoming 7-day schedule
  async getDoctorDashboard(query: DoctorDashboardQuery) {
    const today = query.date ?? new Date().toISOString().split('T')[0];
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
      today_summary: todayStats,
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

  // UC-Dashboard-Patient: Patient dashboard — upcoming appointments, active plans, recent sessions
  async getPatientDashboard(query: PatientDashboardQuery) {
    const today = new Date().toISOString().split('T')[0];

    const upcomingAppointments = await this.appointmentRepo.find({
      where: { patient_id: query.patient_id },
      relations: ['clinic', 'service'],
      order: { appointment_date: 'ASC', appointment_time: 'ASC' },
      take: 10,
    });

    const activeTreatmentPlans = await this.treatmentPlanRepo.find({
      where: { patient_id: query.patient_id, status: 'active' as any },
      order: { created_at: 'DESC' },
      take: 5,
    });

    const recentSessions = await this.sessionRepo.find({
      where: { patient_id: query.patient_id },
      order: { created_at: 'DESC' },
      take: 5,
    });

    return {
      patient_id: query.patient_id,
      upcoming_appointments: upcomingAppointments.filter((a) => {
        const d =
          a.appointment_date instanceof Date
            ? a.appointment_date.toISOString().split('T')[0]
            : a.appointment_date;
        return d >= today && ['scheduled', 'confirmed'].includes(a.status);
      }),
      active_treatment_plans: activeTreatmentPlans,
      recent_sessions: recentSessions,
    };
  }
}
