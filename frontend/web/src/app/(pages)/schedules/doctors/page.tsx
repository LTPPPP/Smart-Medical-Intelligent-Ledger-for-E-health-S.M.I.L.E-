'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';

import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ROUTES } from '@/shared/constants/routes';
import { toast } from '@/shared/lib/toast';
import { TransferModal, ChangesModal } from '@/features/schedule/components/ScheduleModals';
import { doctorName, SCHEDULE_STATUS_STYLE, unwrapArr } from '@/features/schedule/scheduleConstants';

const TEAL = '#45F0CF';
const BLUE = '#92CDFD';
const cardBase = 'rounded-[20px] border border-white/[0.12] bg-white/[0.03] backdrop-blur-[10px]';

interface Schedule {
  schedule_id: string; doctor_id: string; clinic_id: string;
  shift_id?: string | null; work_date: string; max_patients?: number;
  status?: string; clinic?: { clinic_name?: string };
}

export default function WorkSchedulesPage() {
  const qc = useQueryClient();
  const [transferFor, setTransferFor] = useState<Schedule | null>(null);
  const [changesFor, setChangesFor] = useState<Schedule | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['doctor-schedules', 'list'],
    queryFn: () => apiClient.get(API_ENDPOINTS.SCHEDULE.LIST, { params: { limit: 50 } }),
  });
  const schedules = useMemo(() => unwrapArr<Schedule>(data), [data]);

  const cancel = useMutation({
    mutationFn: (id: string) => apiClient.post(API_ENDPOINTS.SCHEDULE.CANCEL(id)),
    onSuccess: () => { toast.success('Schedule cancelled'); qc.invalidateQueries({ queryKey: ['doctor-schedules'] }); },
    onError: (e) => toast.apiError(e, 'Failed to cancel'),
  });

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-8 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.6px] text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>Work &amp; On-Call Schedules</h1>
            <p className="text-sm text-[#C1C7CF]">{schedules.length} shifts</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={ROUTES.MY_SCHEDULE} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#E1E2E6] transition hover:border-white/25">
              <Icon icon="lucide:user-round" width={15} /> My Schedule
            </Link>
            <Link href={ROUTES.DOCTOR_SCHEDULE_NEW} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#003450] transition hover:brightness-95" style={{ background: BLUE, boxShadow: '0 0 15px rgba(146,205,253,0.3)' }}>
              <Icon icon="lucide:plus" width={16} /> New Schedule
            </Link>
          </div>
        </div>

        {isLoading && <div className={`${cardBase} flex items-center justify-center gap-2 py-16 text-[#C1C7CF]`}><Icon icon="line-md:loading-twotone-loop" width={20} /> Loading…</div>}
        {isError && !isLoading && <div className={`${cardBase} p-6 text-center text-sm text-red-300`}>Failed to load. <button onClick={() => refetch()} className="font-semibold underline">Retry</button></div>}
        {!isLoading && !isError && schedules.length === 0 && <div className={`${cardBase} p-10 text-center text-sm text-[#C1C7CF]`}>No schedules yet.</div>}

        {!isLoading && !isError && schedules.length > 0 && (
          <div className={`${cardBase} overflow-x-auto`}>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-[#8B9199]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <tr>
                  <th className="px-5 py-4">Doctor</th>
                  <th className="px-5 py-4">Clinic</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Max</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.schedule_id} className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.04]">
                    <td className="px-5 py-4 font-medium text-white">{doctorName(s.doctor_id)}</td>
                    <td className="px-5 py-4 text-[#C1C7CF]">{s.clinic?.clinic_name ?? '—'}</td>
                    <td className="px-5 py-4 text-[#E1E2E6]">{s.work_date}</td>
                    <td className="px-5 py-4 text-[#C1C7CF]">{s.max_patients ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold capitalize ${SCHEDULE_STATUS_STYLE[(s.status ?? '').toLowerCase()] ?? 'text-[#8B9199]'}`}>{s.status ?? '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1.5">
                        <Link href={ROUTES.DOCTOR_SCHEDULE_EDIT(s.schedule_id)} title="Edit" className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-[#E1E2E6] transition hover:border-white/25"><Icon icon="lucide:pencil" width={14} /></Link>
                        <button onClick={() => setTransferFor(s)} title="Transfer shift" className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-[#92CDFD] transition hover:border-white/25"><Icon icon="lucide:arrow-left-right" width={14} /></button>
                        <button onClick={() => setChangesFor(s)} title="Change history" className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-[#C1C7CF] transition hover:border-white/25"><Icon icon="lucide:history" width={14} /></button>
                        {s.status !== 'cancelled' && (
                          <button onClick={() => { if (confirm('Cancel this schedule?')) cancel.mutate(s.schedule_id); }} title="Cancel" className="rounded-lg border border-red-400/30 bg-red-400/10 p-1.5 text-red-300 transition hover:bg-red-400/20"><Icon icon="lucide:x" width={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-[#8B9199]">
          <Icon icon="lucide:bell" width={12} className="mr-1 inline" style={{ color: TEAL }} />
          Creating, updating or transferring a schedule notifies the affected doctor (see the bell in the top bar).
        </p>
      </div>

      {transferFor && (
        <TransferModal
          scheduleId={transferFor.schedule_id}
          fromDoctorId={transferFor.doctor_id}
          onClose={() => setTransferFor(null)}
          onDone={() => { setTransferFor(null); qc.invalidateQueries({ queryKey: ['doctor-schedules'] }); }}
        />
      )}
      {changesFor && <ChangesModal scheduleId={changesFor.schedule_id} onClose={() => setChangesFor(null)} />}
    </AppShell>
  );
}
