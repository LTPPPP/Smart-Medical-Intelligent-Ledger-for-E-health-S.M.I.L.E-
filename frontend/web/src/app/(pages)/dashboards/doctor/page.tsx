'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { AppShell } from '@/shared/components/layout/AppShell';
import { useAuthStore } from '@/features/auth/store/authStore';
import { DOCTORS, doctorName } from '@/features/schedule/scheduleConstants';
import {
  BLUE,
  CardPanel,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  StatCard,
  TEAL,
  cardBase,
} from '@/features/reports/components/ReportPrimitives';

// ── response shape (reports.service.getDoctorDashboard) ──
interface TodaySummary {
  total?: number | string;
  pending?: number | string;
  confirmed?: number | string;
  completed?: number | string;
  cancelled?: number | string;
}
interface ScheduleItem {
  schedule_id: string;
  work_date: string;
  status?: string;
  max_patients?: number;
  clinic?: { clinic_name?: string } | null;
  shift?: { shift_name?: string; start_time?: string; end_time?: string } | null;
  room?: { room_name?: string; room_code?: string } | null;
}
interface AppointmentItem {
  appointment_id: string;
  appointment_code?: string;
  appointment_date: string;
  appointment_time?: string;
  status?: string;
  chief_complaint?: string | null;
  clinic?: { clinic_name?: string } | null;
  service?: { service_name?: string } | null;
}
interface DoctorDashboard {
  doctor_id: string;
  date: string;
  today_summary: TodaySummary | null;
  upcoming_schedules: ScheduleItem[];
  upcoming_appointments: AppointmentItem[];
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const fmtDate = (d?: string) => (d ? String(d).split('T')[0] : '—');

const STATUS_STYLE: Record<string, string> = {
  scheduled: 'text-[#92CDFD]',
  confirmed: 'text-emerald-300',
  completed: 'text-emerald-300',
  cancelled: 'text-red-300',
  no_show: 'text-red-300',
};

export default function DoctorDashboardPage() {
  const { user } = useAuthStore();
  // Default to the current user if their id matches a known doctor, else first doctor.
  const defaultDoctor = useMemo(() => {
    const match = DOCTORS.find((d) => d.id === user?.userId);
    return match?.id ?? DOCTORS[0]?.id ?? '';
  }, [user?.userId]);
  const [doctorId, setDoctorId] = useState(defaultDoctor);

  useEffect(() => {
    setDoctorId((prev) => prev || defaultDoctor);
  }, [defaultDoctor]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['reports', 'dashboard-doctor', doctorId],
    queryFn: () =>
      apiClient.get<{ data?: DoctorDashboard } | DoctorDashboard>(
        API_ENDPOINTS.REPORTS.DASHBOARD_DOCTOR,
        { params: { doctor_id: doctorId } },
      ),
    enabled: !!doctorId,
  });

  const dash = (data as { data?: DoctorDashboard } | undefined)?.data;
  const summary = dash?.today_summary ?? null;
  const schedules = dash?.upcoming_schedules ?? [];
  const appointments = dash?.upcoming_appointments ?? [];

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-8 py-10">
        <PageHeader
          eyebrow="Performance Management"
          title="Dashboard by Doctor"
          subtitle={`Today (${fmtDate(dash?.date)}) — ${doctorName(doctorId)}`}
          icon="lucide:user-cog"
          right={
            <Link
              href="/admin/performance"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#E1E2E6] transition hover:border-white/25"
            >
              <Icon icon="lucide:gauge" width={16} /> Performance
            </Link>
          }
        />

        {/* Doctor selector */}
        <div className={`${cardBase} flex flex-wrap items-end gap-4 p-5`}>
          <div className="flex flex-col gap-1">
            <label htmlFor="doctor" className="text-[10px] font-semibold uppercase tracking-[2px] text-[#8B9199]">
              Doctor
            </label>
            <select
              id="doctor"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="rounded-xl border border-white/10 bg-[rgba(50,53,56,0.5)] px-3 py-2 text-sm text-white outline-none focus:border-white/25"
            >
              {DOCTORS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
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

        {isError && <ErrorBlock label="Failed to load doctor dashboard." onRetry={() => refetch()} />}

        {/* Today summary */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Today Total" value={num(summary?.total)} icon="lucide:calendar-days" loading={isLoading} accent={BLUE} />
          <StatCard label="Pending" value={num(summary?.pending)} icon="lucide:clock" loading={isLoading} accent={BLUE} />
          <StatCard label="Confirmed" value={num(summary?.confirmed)} icon="lucide:badge-check" loading={isLoading} accent={TEAL} />
          <StatCard label="Completed" value={num(summary?.completed)} icon="lucide:check-circle-2" loading={isLoading} accent={TEAL} />
          <StatCard label="Cancelled" value={num(summary?.cancelled)} icon="lucide:x-circle" loading={isLoading} accent="#fca5a5" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Upcoming schedules */}
          <CardPanel title="Upcoming Schedules (7 days)" icon="lucide:calendar-clock">
            {isLoading ? (
              <LoadingBlock />
            ) : schedules.length === 0 ? (
              <EmptyBlock label="No upcoming schedules" />
            ) : (
              <ul className="divide-y divide-white/5">
                {schedules.map((s) => (
                  <li key={s.schedule_id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{fmtDate(s.work_date)}</p>
                      <p className="truncate text-xs text-[#8B9199]">
                        {s.clinic?.clinic_name ?? '—'}
                        {s.shift?.shift_name ? ` · ${s.shift.shift_name}` : ''}
                        {s.shift?.start_time ? ` (${s.shift.start_time}–${s.shift.end_time})` : ''}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold capitalize ${STATUS_STYLE[s.status ?? ''] ?? 'text-[#C1C7CF]'}`}
                    >
                      {s.status ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardPanel>

          {/* Upcoming appointments */}
          <CardPanel title="Upcoming Appointments" icon="lucide:calendar-check">
            {isLoading ? (
              <LoadingBlock />
            ) : appointments.length === 0 ? (
              <EmptyBlock label="No upcoming appointments" />
            ) : (
              <ul className="divide-y divide-white/5">
                {appointments.map((a) => (
                  <li key={a.appointment_id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {a.service?.service_name ?? a.appointment_code ?? 'Appointment'}
                      </p>
                      <p className="truncate text-xs text-[#8B9199]">
                        {fmtDate(a.appointment_date)}
                        {a.appointment_time ? ` · ${a.appointment_time}` : ''}
                        {a.clinic?.clinic_name ? ` · ${a.clinic.clinic_name}` : ''}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold capitalize ${STATUS_STYLE[a.status ?? ''] ?? 'text-[#C1C7CF]'}`}
                    >
                      {a.status ?? '—'}
                    </span>
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
