'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';

import { useAppointment } from '@/features/appointment/hooks/useAppointment';
import type { AppointmentRow } from '@/features/appointment/types/appointment.type';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ROUTES } from '@/shared/constants/routes';

// ── design tokens (match the booking "Select Path" screen) ───────────────────
const TEAL = '#45F0CF';
const cardBase = 'rounded-[20px] border border-white/[0.12] bg-white/[0.03] backdrop-blur-[10px]';

const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-[#92CDFD]/15 text-[#92CDFD] border-[#92CDFD]/30',
  confirmed: 'bg-[#45F0CF]/15 text-[#45F0CF] border-[#45F0CF]/30',
  completed: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  cancelled: 'bg-red-400/15 text-red-300 border-red-400/30',
  no_show: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
};

const PAY_STYLES: Record<string, string> = {
  paid: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  unpaid: 'bg-white/5 text-[#C1C7CF] border-white/10',
  partially_paid: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  refunded: 'bg-purple-400/15 text-purple-300 border-purple-400/30',
};

const FILTERS = ['all', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'] as const;

function Badge({ value, map }: { value: string; map: Record<string, string> }) {
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${map[value] ?? 'bg-white/5 text-[#C1C7CF] border-white/10'}`}>
      {value?.replace('_', ' ')}
    </span>
  );
}

export default function AppointmentsPage() {
  const { useAppointmentsList } = useAppointment();
  // clinical-emr caps page size at 50.
  const { data, isLoading, isError, refetch } = useAppointmentsList({ limit: 50 });
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');

  // apiClient returns the AxiosResponse; payload is { data: AppointmentRow[] }.
  const rows = useMemo<AppointmentRow[]>(() => {
    const payload = data?.data as unknown;
    if (Array.isArray(payload)) return payload as AppointmentRow[];
    const inner = (payload as { data?: unknown })?.data;
    return Array.isArray(inner) ? (inner as AppointmentRow[]) : [];
  }, [data]);

  const filtered = filter === 'all' ? rows : rows.filter((r) => r.status === filter);
  const paidCount = rows.filter((r) => r.payment_status === 'paid').length;

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-8 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.6px] text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>
              Appointments
            </h1>
            <p className="text-sm text-[#C1C7CF]">
              {rows.length} total · <span style={{ color: TEAL }}>{paidCount} paid</span>
            </p>
          </div>
          <Link
            href={ROUTES.APPOINTMENT_NEW}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#003450] transition hover:brightness-95"
            style={{ background: '#92CDFD', boxShadow: '0 0 15px rgba(146,205,253,0.3)' }}
          >
            <Icon icon="lucide:plus" width={16} /> New Appointment
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="rounded-full border px-3 py-1 text-xs font-semibold capitalize transition"
                style={
                  active
                    ? { background: 'rgba(69,240,207,0.2)', borderColor: TEAL, color: TEAL }
                    : { background: '#1D2023', borderColor: 'rgba(255,255,255,0.1)', color: '#C1C7CF' }
                }
              >
                {f.replace('_', ' ')}
              </button>
            );
          })}
        </div>

        {isLoading && (
          <div className={`${cardBase} flex items-center justify-center gap-2 py-16 text-[#C1C7CF]`}>
            <Icon icon="line-md:loading-twotone-loop" width={20} /> Loading appointments…
          </div>
        )}

        {isError && !isLoading && (
          <div className={`${cardBase} p-6 text-center text-sm text-red-300`}>
            Failed to load appointments.{' '}
            <button onClick={() => refetch()} className="font-semibold underline">Retry</button>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className={`${cardBase} p-10 text-center text-sm text-[#C1C7CF]`}>
            No appointments found for this filter.
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className={`${cardBase} overflow-x-auto`}>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-[#8B9199]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                <tr>
                  <th className="px-5 py-4">Code</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Time</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Payment</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.appointment_id} className="border-b border-white/5 last:border-0 transition hover:bg-white/[0.04]">
                    <td className="px-5 py-4 font-mono text-xs font-semibold" style={{ color: TEAL }}>{r.appointment_code}</td>
                    <td className="px-5 py-4 text-[#E1E2E6]">{r.appointment_date}</td>
                    <td className="px-5 py-4 text-[#E1E2E6]">{r.appointment_time?.slice(0, 5)}</td>
                    <td className="px-5 py-4"><Badge value={r.status} map={STATUS_STYLES} /></td>
                    <td className="px-5 py-4"><Badge value={r.payment_status} map={PAY_STYLES} /></td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={ROUTES.APPOINTMENT_DETAIL(r.appointment_id)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-[#E1E2E6] transition hover:border-white/25"
                        >
                          View
                        </Link>
                        {r.payment_status === 'unpaid' && (
                          <Link
                            href={ROUTES.APPOINTMENT_PAYMENT(r.appointment_id)}
                            className="rounded-lg px-3 py-1 text-xs font-semibold text-[#003450] transition hover:brightness-95"
                            style={{ background: '#92CDFD' }}
                          >
                            Pay
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
