'use client';

import { useMemo } from 'react';

import Link from 'next/link';

import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';

import { unwrapArr } from '@/features/schedule/scheduleConstants';
import { apiClient } from '@/shared/api/client';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ENV } from '@/shared/constants/env';

const cardBase = 'rounded-[20px] border backdrop-blur-xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]';

interface Session {
  session_id: string;
  patient_id?: string | null;
  appointment_id?: string | null;
  doctor_id?: string | null;
  status?: string;
  chief_complaint?: string | null;
  created_at?: string;
  session_date?: string;
}
interface Patient {
  patient_id: string;
  full_name?: string;
  patient_code?: string;
}

const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString() : '—');

const STATUS_STYLE: Record<string, string> = {
  in_progress: 'text-smile-primary',
  completed: 'text-emerald-600 dark:text-emerald-300',
  cancelled: 'text-red-600 dark:text-red-300',
};

export default function ExaminationsPage() {
  const { data: sessRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['examinations', 'list'],
    queryFn: () => apiClient.get(`${ENV.SERVICES.GATEWAY}/examination-sessions`),
  });
  const { data: patRes } = useQuery({
    queryKey: ['patients', 'list'],
    queryFn: () => apiClient.get(`${ENV.SERVICES.GATEWAY}/patients`),
  });

  const sessions = useMemo(() => unwrapArr<Session>(sessRes), [sessRes]);
  const patients = useMemo(() => unwrapArr<Patient>(patRes), [patRes]);
  const patientName = (pid?: string | null) => {
    const p = patients.find((x) => x.patient_id === pid);
    return p?.full_name ?? (pid ? `Patient ${pid.slice(0, 8)}` : '—');
  };

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark font-poppins">
              Clinical Examination
            </h1>
            <p className="text-sm text-smile-description">
              {sessions.length} session{sessions.length === 1 ? '' : 's'}
            </p>
          </div>
          <Link
            href="/examinations/new"
            className="flex items-center gap-2 rounded-full bg-smile-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(65,126,170,0.4)] transition hover:bg-smile-primary-dark"
          >
            <Icon icon="lucide:plus" width={16} /> New session
          </Link>
        </div>

        {isLoading && (
          <div className={`${cardBase} flex items-center justify-center gap-2 py-16 text-smile-description`}>
            <Icon icon="line-md:loading-twotone-loop" width={20} /> Loading sessions…
          </div>
        )}

        {isError && !isLoading && (
          <div className={`${cardBase} p-6 text-center text-sm text-red-600 dark:text-red-300`}>
            Failed to load examination sessions.{' '}
            <button onClick={() => refetch()} className="font-semibold underline">Retry</button>
          </div>
        )}

        {!isLoading && !isError && sessions.length === 0 && (
          <div className={`${cardBase} p-10 text-center text-sm text-smile-description`}>No examination sessions yet.</div>
        )}

        {!isLoading && !isError && sessions.length > 0 && (
          <div className={`${cardBase} overflow-hidden`}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b [border-color:var(--surface-panel-border)] text-xs uppercase tracking-[1px] text-smile-description">
                  <th className="px-6 py-4 font-semibold">Session</th>
                  <th className="px-6 py-4 font-semibold">Patient</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Created</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const status = (s.status ?? 'in_progress').toLowerCase();
                  return (
                    <tr key={s.session_id} className="border-b [border-color:var(--surface-panel-border)] transition hover:bg-smile-primary-light/30">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-semibold text-smile-primary">
                          {s.session_id.slice(0, 8)}
                        </span>
                        {s.chief_complaint && (
                          <div className="mt-0.5 max-w-[220px] truncate text-xs text-smile-description">{s.chief_complaint}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-smile-title">{patientName(s.patient_id)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold capitalize ${STATUS_STYLE[status] ?? 'text-smile-description'}`}>
                          {status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-smile-description">{fmtDate(s.created_at ?? s.session_date)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/examinations/${s.session_id}`}
                          className="rounded-lg border [background:var(--surface-panel-bg)] [border-color:var(--surface-panel-border)] px-3 py-1.5 text-xs font-semibold text-smile-title transition hover:border-smile-primary/40 hover:text-smile-primary"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
