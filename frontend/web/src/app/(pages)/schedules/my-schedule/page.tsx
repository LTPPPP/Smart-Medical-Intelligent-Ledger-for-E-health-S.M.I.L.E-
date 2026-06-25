'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';

import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { AppShell } from '@/shared/components/layout/AppShell';
import { useAuthStore } from '@/features/auth/store/authStore';
import { ScheduleForm, type ScheduleFormValues } from '@/features/schedule/components/ScheduleForm';
import { DOCTORS, SCHEDULE_STATUS_STYLE, doctorName, unwrapArr } from '@/features/schedule/scheduleConstants';
import { ROUTES } from '@/shared/constants/routes';
import { toast } from '@/shared/lib/toast';

const TEAL = '#45F0CF';
const BLUE = '#92CDFD';
const cardBase = 'rounded-[20px] border border-white/[0.12] bg-white/[0.03] backdrop-blur-[10px]';

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
            <h1 className="text-[28px] font-bold tracking-[-0.6px] text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>My Schedule</h1>
            <p className="text-sm text-[#C1C7CF]">Personal examination schedule · {upcoming.length} upcoming</p>
          </div>
          <button onClick={() => setRegisterOpen(true)} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#003450] transition hover:brightness-95" style={{ background: BLUE, boxShadow: '0 0 15px rgba(146,205,253,0.3)' }}>
            <Icon icon="lucide:calendar-plus" width={16} /> Register schedule
          </button>
        </div>

        {/* Doctor selector (demo: admin can view any doctor's personal schedule) */}
        <div className={`${cardBase} flex items-center gap-3 p-4`}>
          <Icon icon="lucide:user-round" width={18} style={{ color: BLUE }} />
          <span className="text-sm text-[#C1C7CF]">Viewing:</span>
          <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="h-9 rounded-lg border border-white/10 bg-[rgba(50,53,56,0.5)] px-3 text-sm text-white outline-none">
            {DOCTORS.map((d) => <option key={d.id} value={d.id} className="bg-[#16191c]">{d.name}</option>)}
          </select>
        </div>

        {isLoading && <div className={`${cardBase} flex items-center justify-center gap-2 py-16 text-[#C1C7CF]`}><Icon icon="line-md:loading-twotone-loop" width={20} /> Loading…</div>}
        {isError && !isLoading && <div className={`${cardBase} p-6 text-center text-sm text-red-300`}>Failed to load. <button onClick={() => refetch()} className="font-semibold underline">Retry</button></div>}
        {!isLoading && !isError && schedules.length === 0 && <div className={`${cardBase} p-10 text-center text-sm text-[#C1C7CF]`}>No schedule registered for {doctorName(doctorId)} yet.</div>}

        {!isLoading && !isError && schedules.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {schedules.map((s) => (
              <div key={s.schedule_id} className={`${cardBase} flex items-center justify-between p-5`}>
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 flex-col items-center justify-center rounded-xl border border-white/10 bg-[#323538]">
                    <span className="text-[10px] uppercase" style={{ color: TEAL }}>{new Date(s.work_date).toLocaleDateString('en', { month: 'short' })}</span>
                    <span className="text-lg font-bold text-white">{new Date(s.work_date).getDate()}</span>
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">{s.clinic?.clinic_name ?? 'Clinic'}</span>
                    <span className={`text-xs font-semibold capitalize ${SCHEDULE_STATUS_STYLE[(s.status ?? '').toLowerCase()] ?? 'text-[#8B9199]'}`}>{s.status ?? '—'} · max {s.max_patients ?? '—'}</span>
                  </div>
                </div>
                <Link href={ROUTES.DOCTOR_SCHEDULE_EDIT(s.schedule_id)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-[#E1E2E6] transition hover:border-white/25">Update</Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {registerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setRegisterOpen(false)}>
          <div className="w-full max-w-2xl rounded-[20px] border border-white/[0.12] bg-[#16191c] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>Register personal schedule</h3>
              <button onClick={() => setRegisterOpen(false)} className="text-[#C1C7CF] transition hover:text-white"><Icon icon="lucide:x" width={18} /></button>
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
