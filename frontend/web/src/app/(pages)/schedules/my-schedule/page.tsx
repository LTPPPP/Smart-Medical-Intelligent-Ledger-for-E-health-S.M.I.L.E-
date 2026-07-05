'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { ScheduleForm, type ScheduleFormValues } from '@/features/schedule/components/ScheduleForm';
import { SCHEDULE_STATUS_STYLE, unwrapArr } from '@/features/schedule/scheduleConstants';
import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ROUTES } from '@/shared/constants/routes';
import { toast } from '@/shared/lib/toast';

const TEAL = '#2E7EAE';
const cardBase = 'rounded-[20px] border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] backdrop-blur-xl';

interface Schedule {
  schedule_id: string; doctor_id: string; work_date: string;
  shift_id?: string | null; max_patients?: number; status?: string;
  clinic?: { clinic_name?: string };
}

export default function MySchedulePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const doctorId = user?.userId ?? '';
  const doctorLabel =
    user?.fullName ?? user?.email ?? (doctorId ? `Doctor ${doctorId.slice(0, 8)}` : 'Signed-in doctor');
  const [registerOpen, setRegisterOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['doctor-schedules', 'by-doctor', doctorId],
    queryFn: () => apiClient.get(API_ENDPOINTS.SCHEDULE.BY_DOCTOR(doctorId)),
    enabled: !!doctorId,
  });
  const schedules = useMemo(() => unwrapArr<Schedule>(data), [data]);
  const upcoming = schedules.filter((s) => s.work_date >= new Date().toISOString().slice(0, 10));

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
            <h1 className="text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark" style={{ fontFamily: 'Public Sans, sans-serif' }}>My Schedule</h1>
            <p className="text-sm text-smile-description">Personal examination schedule · {upcoming.length} upcoming</p>
          </div>
          <button onClick={() => setRegisterOpen((open) => !open)} className="flex items-center gap-2 rounded-full bg-smile-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-smile-primary-dark">
            <Icon icon="lucide:calendar-plus" width={16} /> Register schedule
          </button>
        </div>

        <div className={`${cardBase} flex items-center gap-3 p-4`}>
          <Icon icon="lucide:user-round" width={18} className="text-smile-primary" />
          <span className="text-sm text-smile-description">Viewing:</span>
          <span className="rounded-lg border px-3 py-2 text-sm text-smile-title [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)]">
            {doctorLabel}
          </span>
        </div>

        {registerOpen && (
          <div className={`${cardBase} p-6`}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-smile-title" style={{ fontFamily: 'Public Sans, sans-serif' }}>Register personal schedule</h3>
              <button onClick={() => setRegisterOpen(false)} className="text-smile-description transition hover:text-smile-primary"><Icon icon="lucide:x" width={18} /></button>
            </div>
            <ScheduleForm
              key={doctorId || 'no-doctor'}
              mode="create"
              lockDoctor
              doctorLabel={doctorLabel}
              initial={{ doctor_id: doctorId }}
              submitLabel="Register"
              submitting={register.isPending}
              onSubmit={(v) => register.mutate(v)}
              onCancel={() => setRegisterOpen(false)}
            />
          </div>
        )}

        {isLoading && <div className={`${cardBase} flex items-center justify-center gap-2 py-16 text-smile-description`}><Icon icon="line-md:loading-twotone-loop" width={20} /> Loading…</div>}
        {isError && !isLoading && <div className={`${cardBase} p-6 text-center text-sm text-red-300`}>Failed to load. <button onClick={() => refetch()} className="font-semibold underline">Retry</button></div>}
        {!isLoading && !isError && schedules.length === 0 && <div className={`${cardBase} p-10 text-center text-sm text-smile-description`}>No schedule registered for {doctorLabel} yet.</div>}

        {!isLoading && !isError && schedules.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {schedules.map((s) => (
              <div key={s.schedule_id} className={`${cardBase} flex items-center justify-between p-5`}>
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 flex-col items-center justify-center rounded-xl border [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)]">
                    <span className="text-[10px] uppercase" style={{ color: TEAL }}>{new Date(s.work_date).toLocaleDateString('en', { month: 'short' })}</span>
                    <span className="text-lg font-bold text-smile-title">{new Date(s.work_date).getDate()}</span>
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-smile-title">{s.clinic?.clinic_name ?? 'Clinic'}</span>
                    <span className={`text-xs font-semibold capitalize ${SCHEDULE_STATUS_STYLE[(s.status ?? '').toLowerCase()] ?? 'text-smile-description'}`}>{s.status ?? '—'} · max {s.max_patients ?? '—'}</span>
                  </div>
                </div>
                <Link href={ROUTES.DOCTOR_SCHEDULE_EDIT(s.schedule_id)} className="rounded-lg border px-3 py-1 text-xs font-semibold text-smile-title transition hover:border-smile-primary/40 [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)]">Update</Link>
              </div>
            ))}
          </div>
        )}
      </div>

    </AppShell>
  );
}
