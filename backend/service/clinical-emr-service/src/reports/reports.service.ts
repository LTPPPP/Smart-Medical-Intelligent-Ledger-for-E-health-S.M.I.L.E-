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
