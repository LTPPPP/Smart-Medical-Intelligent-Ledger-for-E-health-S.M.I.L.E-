'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { ENV } from '@/shared/constants/env';
import { ROUTES } from '@/shared/constants/routes';
import { useAuthStore } from '@/features/auth/store/authStore';
import {
  DashboardHeader,
  DashPanel,
  DashLoading,
  DashEmpty,
  DashError,
  DashQuickLink,
  STATUS_STYLE,
  fmtDate,
} from './DashboardPrimitives';

interface Patient {
  patient_id: string;
  full_name?: string;
  patient_code?: string;
}
interface AppointmentItem {
  appointment_id: string;
  appointment_code?: string;
  appointment_date: string;
  appointment_time?: string;
  status?: string;
  clinic?: { clinic_name?: string } | null;
  service?: { service_name?: string } | null;
}
interface TreatmentPlan {
  plan_id: string;
  plan_name?: string | null;
  objectives?: string | null;
  duration_weeks?: number | null;
  status?: string;
}
interface ExamSession {
  session_id: string;
  session_date?: string;
  chief_complaint?: string | null;
  status?: string;
}
interface PatientDashboard {
  patient_id: string;
  upcoming_appointments: AppointmentItem[];
  active_treatment_plans: TreatmentPlan[];
  recent_sessions: ExamSession[];
}

export function PatientDashboard() {
  const { user } = useAuthStore();

  const { data: patientsRes, isLoading: patientsLoading } = useQuery({
    queryKey: ['patients', 'list-for-dashboard'],
    queryFn: () => apiClient.get<{ data?: Patient[] } | Patient[]>(`${ENV.SERVICES.GATEWAY}/patients`),
  });

  const patients = useMemo<Patient[]>(() => {
    const payload = (patientsRes as { data?: unknown } | undefined)?.data;
    if (Array.isArray(payload)) return payload as Patient[];
    const inner = (payload as { data?: unknown })?.data;
    return Array.isArray(inner) ? (inner as Patient[]) : [];
  }, [patientsRes]);

  const [patientId, setPatientId] = useState('');
  useEffect(() => setPatientId((prev) => prev || patients[0]?.patient_id || ''), [patients]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'dashboard-patient', patientId],
    queryFn: () =>
      apiClient.get<{ data?: PatientDashboard } | PatientDashboard>(API_ENDPOINTS.REPORTS.DASHBOARD_PATIENT, {
        params: { patient_id: patientId },
      }),
    enabled: !!patientId,
  });

  const dash = (data as { data?: PatientDashboard } | undefined)?.data;
  const appointments = dash?.upcoming_appointments ?? [];
  const plans = dash?.active_treatment_plans ?? [];
  const sessions = dash?.recent_sessions ?? [];

  const quickLinks = [
    { href: ROUTES.APPOINTMENT_NEW, icon: 'lucide:calendar-plus', label: 'Book Appointment', description: 'Schedule a new dental visit' },
    { href: ROUTES.CLINICS, icon: 'lucide:hospital', label: 'Find Clinics', description: 'Discover dental clinics near you' },
    { href: ROUTES.CHAT, icon: 'lucide:bot-message-square', label: 'Booking Assistant', description: 'Chat to book or manage visits' },
    { href: ROUTES.PROFILE, icon: 'lucide:user-circle', label: 'My Profile', description: 'View & edit your information' },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
      <DashboardHeader
        eyebrow="My Care"
        title={`Welcome back, ${user?.fullName?.split(' ')[0] ?? 'there'}`}
        subtitle="Your appointments, treatment plans, and recent visits at a glance."
        icon="lucide:user"
      />

      {/* Quick access */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((l) => <DashQuickLink key={l.href} {...l} />)}
      </div>

      {/* Patient selector (staff can pick; patient sees own) */}
      {patients.length > 1 && (
        <div className="flex flex-wrap items-end gap-4 rounded-2xl border p-5 backdrop-blur-xl" style={{ background: 'var(--surface-card-bg)', borderColor: 'var(--surface-card-border)' }}>
          <div className="flex flex-col gap-1">
            <label htmlFor="patient" className="font-inter text-[10px] font-semibold uppercase tracking-[2px] text-smile-description">Patient</label>
            <select
              id="patient"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              disabled={patientsLoading || patients.length === 0}
              className="min-w-[260px] rounded-xl border px-3 py-2 font-inter text-sm text-smile-title outline-none focus:border-smile-primary/40 disabled:opacity-50"
              style={{ background: 'var(--surface-input-bg)', borderColor: 'var(--surface-input-border)' }}
            >
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.full_name ?? p.patient_code ?? p.patient_id.slice(0, 8)}{p.patient_code ? ` (${p.patient_code})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {isError && <DashError label="Failed to load your dashboard." onRetry={() => refetch()} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashPanel title="Upcoming Appointments" icon="lucide:calendar-check">
          {isLoading ? <DashLoading /> : appointments.length === 0 ? <DashEmpty label="No upcoming appointments" /> : (
            <ul className="divide-y" style={{ borderColor: 'var(--surface-panel-border)' }}>
              {appointments.map((a) => (
                <li key={a.appointment_id} className="px-6 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-inter text-sm font-medium text-smile-title">{a.service?.service_name ?? a.appointment_code ?? 'Appointment'}</p>
                    <span className={`shrink-0 font-inter text-xs font-semibold capitalize ${STATUS_STYLE[a.status ?? ''] ?? 'text-smile-description'}`}>{a.status ?? '—'}</span>
                  </div>
                  <p className="mt-0.5 truncate font-inter text-xs text-smile-description">
                    {fmtDate(a.appointment_date)}
                    {a.appointment_time ? ` · ${a.appointment_time}` : ''}
                    {a.clinic?.clinic_name ? ` · ${a.clinic.clinic_name}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </DashPanel>

        <DashPanel title="Active Treatment Plans" icon="lucide:clipboard-list">
          {isLoading ? <DashLoading /> : plans.length === 0 ? <DashEmpty label="No active treatment plans" /> : (
            <ul className="divide-y" style={{ borderColor: 'var(--surface-panel-border)' }}>
              {plans.map((p) => (
                <li key={p.plan_id} className="px-6 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-inter text-sm font-medium text-smile-title">{p.plan_name ?? 'Treatment plan'}</p>
                    <span className={`shrink-0 font-inter text-xs font-semibold capitalize ${STATUS_STYLE[p.status ?? ''] ?? 'text-smile-description'}`}>{p.status ?? '—'}</span>
                  </div>
                  {p.objectives && <p className="mt-0.5 line-clamp-2 font-inter text-xs text-smile-description">{p.objectives}</p>}
                  {typeof p.duration_weeks === 'number' && (
                    <p className="mt-0.5 font-inter text-xs text-smile-primary">{p.duration_weeks} week{p.duration_weeks === 1 ? '' : 's'}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </DashPanel>

        <DashPanel title="Recent Sessions" icon="lucide:stethoscope">
          {isLoading ? <DashLoading /> : sessions.length === 0 ? <DashEmpty label="No recent sessions" /> : (
            <ul className="divide-y" style={{ borderColor: 'var(--surface-panel-border)' }}>
              {sessions.map((s) => (
                <li key={s.session_id} className="px-6 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-inter text-sm font-medium text-smile-title">{s.chief_complaint ?? 'Examination session'}</p>
                    <span className={`shrink-0 font-inter text-xs font-semibold capitalize ${STATUS_STYLE[s.status ?? ''] ?? 'text-smile-description'}`}>{s.status ?? '—'}</span>
                  </div>
                  <p className="mt-0.5 font-inter text-xs text-smile-description">{fmtDate(s.session_date)}</p>
                </li>
              ))}
            </ul>
          )}
        </DashPanel>
      </div>
    </div>
  );
}
