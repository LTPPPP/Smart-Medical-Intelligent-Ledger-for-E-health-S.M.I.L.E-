'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { ScheduleForm, type ScheduleFormValues } from '@/features/schedule/components/ScheduleForm';
import { DOCTORS, SCHEDULE_STATUS_STYLE, doctorName, unwrapArr } from '@/features/schedule/scheduleConstants';
import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { CalendarView, type CalendarEvent } from '@/shared/components/common/CalendarView';
import { ViewToggle, type ViewMode } from '@/shared/components/common/ViewToggle';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ROUTES } from '@/shared/constants/routes';
import { toast } from '@/shared/lib/toast';

const cardBase = 'rounded-[20px] border backdrop-blur-xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]';

const CAL_TONE: Record<string, string> = {
  scheduled: 'bg-smile-primary/15 text-smile-primary',
  completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  cancelled: 'bg-red-500/15 text-red-600 dark:text-red-300',
};

interface Schedule {
  schedule_id: string; doctor_id: string; work_date: string;
  shift_id?: string | null; max_patients?: number; status?: string;
  clinic?: { clinic_name?: string };
}

export default function MySchedulePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  // Default to the logged-in user if they're a seeded doctor, else first doctor (demo).
  const initialDoctor = DOCTORS.find((d) => d.id === user?.userId)?.id ?? DOCTORS[0].id;
  const [doctorId, setDoctorId] = useState(initialDoctor);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [view, setView] = useState<ViewMode>('list');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['doctor-schedules', 'by-doctor', doctorId],
    queryFn: () => apiClient.get(API_ENDPOINTS.SCHEDULE.BY_DOCTOR(doctorId)),
    enabled: !!doctorId,
  });
  const schedules = useMemo(() => unwrapArr<Schedule>(data), [data]);
  const upcoming = schedules.filter((s) => s.work_date >= new Date().toISOString().slice(0, 10));

  const calendarEvents = useMemo<CalendarEvent[]>(
    () =>
      schedules
        .filter((s) => s.work_date)
        .map((s) => ({
          id: s.schedule_id,
          date: s.work_date,
          label: s.clinic?.clinic_name ?? 'Shift',
          meta: s.status,
          tone: CAL_TONE[(s.status ?? '').toLowerCase()],
        })),
    [schedules],
  );

  const register = useMutation({
    mutationFn: (v: ScheduleFormValues) => apiClient.post(API_ENDPOINTS.SCHEDULE.CREATE, v),
    onSuccess: () => { toast.success('Personal schedule registered'); qc.invalidateQueries({ queryKey: ['doctor-schedules'] }); setRegisterOpen(false); },
    onError: (e) => toast.apiError(e, 'Failed to register schedule'),
  });

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-poppins text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark">My Schedule</h1>
            <p className="text-sm text-smile-description">Personal examination schedule · {upcoming.length} upcoming</p>
          </div>
          <div className="flex items-center gap-2">
            <ViewToggle mode={view} onChange={setView} />
            <button onClick={() => setRegisterOpen(true)} className="flex items-center gap-2 rounded-full bg-smile-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition hover:bg-smile-primary-dark">
              <Icon icon="lucide:calendar-plus" width={16} /> Register schedule
            </button>
          </div>
        </div>

        {/* Doctor selector (demo: admin can view any doctor's personal schedule) */}
        <div className={`${cardBase} flex items-center gap-3 p-4`}>
          <Icon icon="lucide:user-round" width={18} className="text-smile-primary" />
          <span className="text-sm text-smile-description">Viewing:</span>
          <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="h-9 rounded-lg border px-3 text-sm text-smile-title outline-none [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]">
            {DOCTORS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {isLoading && <div className={`${cardBase} flex items-center justify-center gap-2 py-16 text-smile-description`}><Icon icon="line-md:loading-twotone-loop" width={20} /> Loading…</div>}
        {isError && !isLoading && <div className={`${cardBase} p-6 text-center text-sm text-red-600 dark:text-red-300`}>Failed to load. <button onClick={() => refetch()} className="font-semibold underline">Retry</button></div>}
        {!isLoading && !isError && schedules.length === 0 && <div className={`${cardBase} p-10 text-center text-sm text-smile-description`}>No schedule registered for {doctorName(doctorId)} yet.</div>}

        {!isLoading && !isError && schedules.length > 0 && view === 'calendar' && (
          <CalendarView events={calendarEvents} onEventClick={(id) => { const s = schedules.find((x) => x.schedule_id === id); if (s) window.location.assign(ROUTES.DOCTOR_SCHEDULE_EDIT(s.schedule_id)); }} />
        )}

        {!isLoading && !isError && schedules.length > 0 && view === 'list' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {schedules.map((s) => (
              <div key={s.schedule_id} className={`${cardBase} flex items-center justify-between p-5`}>
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 flex-col items-center justify-center rounded-xl border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)]">
                    <span className="text-[10px] uppercase text-smile-primary">{new Date(s.work_date).toLocaleDateString('en', { month: 'short' })}</span>
                    <span className="text-lg font-bold text-smile-title">{new Date(s.work_date).getDate()}</span>
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-smile-title">{s.clinic?.clinic_name ?? 'Clinic'}</span>
                    <span className={`text-xs font-semibold capitalize ${SCHEDULE_STATUS_STYLE[(s.status ?? '').toLowerCase()] ?? 'text-smile-description'}`}>{s.status ?? '—'} · max {s.max_patients ?? '—'}</span>
                  </div>
                </div>
                <Link href={ROUTES.DOCTOR_SCHEDULE_EDIT(s.schedule_id)} className="rounded-lg border px-3 py-1 text-xs font-semibold text-smile-title transition hover:border-smile-primary/40 hover:text-smile-primary [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)]">Update</Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {registerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setRegisterOpen(false)}>
          <div className="w-full max-w-2xl rounded-[20px] border p-6 shadow-2xl backdrop-blur-xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-poppins text-lg font-semibold text-smile-primary-dark">Register personal schedule</h3>
              <button onClick={() => setRegisterOpen(false)} className="text-smile-description transition hover:text-smile-primary"><Icon icon="lucide:x" width={18} /></button>
            </div>
            <ScheduleForm
              mode="create"
              lockDoctor
              initial={{ doctor_id: doctorId }}
              submitLabel="Register"
              submitting={register.isPending}
              onSubmit={(v) => register.mutate(v)}
              onCancel={() => setRegisterOpen(false)}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}
