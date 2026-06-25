'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { ENV } from '@/shared/constants/env';
import { AppShell } from '@/shared/components/layout/AppShell';
import {
  BLUE,
  CardPanel,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  TEAL,
  cardBase,
} from '@/features/reports/components/ReportPrimitives';

// ── /patients (raw array from gateway) ──
interface Patient {
  patient_id: string;
  full_name?: string;
  patient_code?: string;
}

// ── response shape (reports.service.getPatientDashboard) ──
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

const fmtDate = (d?: string) => (d ? String(d).split('T')[0] : '—');

const STATUS_STYLE: Record<string, string> = {
  scheduled: 'text-[#92CDFD]',
  confirmed: 'text-emerald-300',
  completed: 'text-emerald-300',
  in_progress: 'text-[#92CDFD]',
  active: 'text-emerald-300',
  cancelled: 'text-red-300',
};

export default function PatientDashboardPage() {
  // Patients list (raw array from gateway).
  const { data: patientsRes, isLoading: patientsLoading } = useQuery({
    queryKey: ['patients', 'list-for-dashboard'],
    queryFn: () =>
      apiClient.get<{ data?: Patient[] } | Patient[]>(`${ENV.SERVICES.GATEWAY}/patients`),
  });

  const patients = useMemo<Patient[]>(() => {
    const payload = (patientsRes as { data?: unknown } | undefined)?.data;
    if (Array.isArray(payload)) return payload as Patient[];
    const inner = (payload as { data?: unknown })?.data;
    return Array.isArray(inner) ? (inner as Patient[]) : [];
  }, [patientsRes]);

  const [patientId, setPatientId] = useState('');
  useEffect(() => {
    setPatientId((prev) => prev || patients[0]?.patient_id || '');
  }, [patients]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['reports', 'dashboard-patient', patientId],
    queryFn: () =>
      apiClient.get<{ data?: PatientDashboard } | PatientDashboard>(
        API_ENDPOINTS.REPORTS.DASHBOARD_PATIENT,
        { params: { patient_id: patientId } },
      ),
    enabled: !!patientId,
  });

  const dash = (data as { data?: PatientDashboard } | undefined)?.data;
  const appointments = dash?.upcoming_appointments ?? [];
  const plans = dash?.active_treatment_plans ?? [];
  const sessions = dash?.recent_sessions ?? [];

  const selectedPatient = patients.find((p) => p.patient_id === patientId);

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-8 py-10">
        <PageHeader
          eyebrow="Performance Management"
          title="Dashboard by Customer"
          subtitle={
            selectedPatient
              ? `${selectedPatient.full_name ?? 'Patient'}${selectedPatient.patient_code ? ` · ${selectedPatient.patient_code}` : ''}`
              : 'Select a customer to view their care overview.'
          }
          icon="lucide:user"
          right={
            <Link
              href="/admin/performance"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#E1E2E6] transition hover:border-white/25"
            >
              <Icon icon="lucide:gauge" width={16} /> Performance
            </Link>
          }
        />

        {/* Patient selector */}
        <div className={`${cardBase} flex flex-wrap items-end gap-4 p-5`}>
          <div className="flex flex-col gap-1">
            <label htmlFor="patient" className="text-[10px] font-semibold uppercase tracking-[2px] text-[#8B9199]">
              Customer
            </label>
            <select
              id="patient"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              disabled={patientsLoading || patients.length === 0}
              className="min-w-[260px] rounded-xl border border-white/10 bg-[rgba(50,53,56,0.5)] px-3 py-2 text-sm text-white outline-none focus:border-white/25 disabled:opacity-50"
            >
              {patients.length === 0 && <option value="">{patientsLoading ? 'Loading…' : 'No customers'}</option>}
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.full_name ?? p.patient_code ?? p.patient_id.slice(0, 8)}
                  {p.patient_code ? ` (${p.patient_code})` : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching || !patientId}
            className="ml-auto flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#003450] transition hover:brightness-95 disabled:opacity-50"
            style={{ background: BLUE }}
          >
            <Icon
              icon={isFetching ? 'lucide:loader-2' : 'lucide:refresh-cw'}
              width={15}
              className={isFetching ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>

        {isError && <ErrorBlock label="Failed to load customer dashboard." onRetry={() => refetch()} />}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Upcoming appointments */}
          <CardPanel title="Upcoming Appointments" icon="lucide:calendar-check">
            {isLoading ? (
              <LoadingBlock />
            ) : appointments.length === 0 ? (
              <EmptyBlock label="No upcoming appointments" />
            ) : (
              <ul className="divide-y divide-white/5">
                {appointments.map((a) => (
                  <li key={a.appointment_id} className="px-6 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-white">
                        {a.service?.service_name ?? a.appointment_code ?? 'Appointment'}
                      </p>
                      <span
                        className={`shrink-0 text-xs font-semibold capitalize ${STATUS_STYLE[a.status ?? ''] ?? 'text-[#C1C7CF]'}`}
                      >
                        {a.status ?? '—'}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[#8B9199]">
                      {fmtDate(a.appointment_date)}
                      {a.appointment_time ? ` · ${a.appointment_time}` : ''}
                      {a.clinic?.clinic_name ? ` · ${a.clinic.clinic_name}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardPanel>

          {/* Active treatment plans */}
          <CardPanel title="Active Treatment Plans" icon="lucide:clipboard-list">
            {isLoading ? (
              <LoadingBlock />
            ) : plans.length === 0 ? (
              <EmptyBlock label="No active treatment plans" />
            ) : (
              <ul className="divide-y divide-white/5">
                {plans.map((p) => (
                  <li key={p.plan_id} className="px-6 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-white">{p.plan_name ?? 'Treatment plan'}</p>
                      <span
                        className={`shrink-0 text-xs font-semibold capitalize ${STATUS_STYLE[p.status ?? ''] ?? 'text-[#C1C7CF]'}`}
                      >
                        {p.status ?? '—'}
                      </span>
                    </div>
                    {p.objectives && <p className="mt-0.5 line-clamp-2 text-xs text-[#8B9199]">{p.objectives}</p>}
                    {typeof p.duration_weeks === 'number' && (
                      <p className="mt-0.5 text-xs" style={{ color: TEAL }}>
                        {p.duration_weeks} week{p.duration_weeks === 1 ? '' : 's'}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardPanel>

          {/* Recent sessions */}
          <CardPanel title="Recent Sessions" icon="lucide:stethoscope">
            {isLoading ? (
              <LoadingBlock />
            ) : sessions.length === 0 ? (
              <EmptyBlock label="No recent sessions" />
            ) : (
              <ul className="divide-y divide-white/5">
                {sessions.map((s) => (
                  <li key={s.session_id} className="px-6 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-white">
                        {s.chief_complaint ?? 'Examination session'}
                      </p>
                      <span
                        className={`shrink-0 text-xs font-semibold capitalize ${STATUS_STYLE[s.status ?? ''] ?? 'text-[#C1C7CF]'}`}
                      >
                        {s.status ?? '—'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#8B9199]">{fmtDate(s.session_date)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardPanel>
        </div>
      </div>
    </AppShell>
  );
}
