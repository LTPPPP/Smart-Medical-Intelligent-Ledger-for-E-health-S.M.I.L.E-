'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { AppShell } from '@/shared/components/layout/AppShell';
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

// ── response shape (clinical-emr reports.service.getDoctorPerformance) ──
interface DoctorPerfRow {
  doctor_id: string;
  total_appointments: number | string;
  completed: number | string;
  cancelled: number | string;
  no_show: number | string;
  completion_rate_pct: number | string | null;
  cancellation_rate_pct: number | string | null;
  avg_duration_minutes: number | string | null;
}
interface DoctorPerfReport {
  period: { date_from: string; date_to: string };
  doctors: DoctorPerfRow[];
}

const toISODate = (d: Date) => d.toISOString().split('T')[0];
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const defaultRange = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 60);
  return { from: toISODate(from), to: toISODate(to) };
};

export default function DoctorPerformancePage() {
  const initial = useMemo(defaultRange, []);
  const [dateFrom, setDateFrom] = useState(initial.from);
  const [dateTo, setDateTo] = useState(initial.to);
  const [doctorId, setDoctorId] = useState('');

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['reports', 'doctor-performance', dateFrom, dateTo, doctorId],
    queryFn: () =>
      apiClient.get<{ data?: DoctorPerfReport } | DoctorPerfReport>(
        API_ENDPOINTS.REPORTS.DOCTOR_PERFORMANCE,
        {
          params: {
            date_from: dateFrom,
            date_to: dateTo,
            ...(doctorId ? { doctor_id: doctorId } : {}),
          },
        },
      ),
    enabled: !!dateFrom && !!dateTo,
  });

  // Report endpoints return the payload object directly under AxiosResponse.data.
  const report = (data as { data?: DoctorPerfReport } | undefined)?.data;
  const rows = useMemo<DoctorPerfRow[]>(
    () => (Array.isArray(report?.doctors) ? report!.doctors : []),
    [report],
  );

  const totalDoctors = rows.length;
  const avgCompletion = useMemo(() => {
    if (!rows.length) return 0;
    const sum = rows.reduce((a, r) => a + num(r.completion_rate_pct), 0);
    return Math.round((sum / rows.length) * 10) / 10;
  }, [rows]);
  const totalAppointments = useMemo(
    () => rows.reduce((a, r) => a + num(r.total_appointments), 0),
    [rows],
  );

  const chartData = useMemo(
    () =>
      rows.map((r) => ({
        name: doctorName(r.doctor_id).replace(/^Dr\.?\s*/i, ''),
        completion: num(r.completion_rate_pct),
        cancellation: num(r.cancellation_rate_pct),
      })),
    [rows],
  );

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-8 py-10">
        <PageHeader
          eyebrow="Performance Management"
          title="Doctor Performance"
          subtitle="Appointment outcomes and completion rates by doctor."
          icon="lucide:gauge"
          right={
            <>
              <Link
                href="/dashboards/doctor"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#E1E2E6] transition hover:border-white/25"
              >
                <Icon icon="lucide:user-cog" width={16} /> Doctor Dashboard
              </Link>
              <Link
                href="/dashboards/patient"
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-[#E1E2E6] transition hover:border-white/25"
              >
                <Icon icon="lucide:user" width={16} /> Customer Dashboard
              </Link>
              <Link
                href="/admin/revenue-reports"
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[#003450] transition hover:brightness-95"
                style={{ background: BLUE, boxShadow: '0 0 15px rgba(146,205,253,0.3)' }}
              >
                <Icon icon="lucide:bar-chart-3" width={16} /> Revenue
              </Link>
            </>
          }
        />

        {/* Filters */}
        <div className={`${cardBase} flex flex-wrap items-end gap-4 p-5`}>
          <div className="flex flex-col gap-1">
            <label htmlFor="from" className="text-[10px] font-semibold uppercase tracking-[2px] text-[#8B9199]">
              From
            </label>
            <input
              id="from"
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-xl border border-white/10 bg-[rgba(50,53,56,0.5)] px-3 py-2 text-sm text-white outline-none focus:border-white/25"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="to" className="text-[10px] font-semibold uppercase tracking-[2px] text-[#8B9199]">
              To
            </label>
            <input
              id="to"
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl border border-white/10 bg-[rgba(50,53,56,0.5)] px-3 py-2 text-sm text-white outline-none focus:border-white/25"
            />
          </div>
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
              <option value="">All doctors</option>
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

        {isError && <ErrorBlock label="Failed to load doctor performance report." onRetry={() => refetch()} />}

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Doctors" value={totalDoctors} icon="lucide:users" loading={isLoading} accent={BLUE} />
          <StatCard
            label="Avg Completion Rate"
            value={`${avgCompletion}%`}
            icon="lucide:check-circle-2"
            loading={isLoading}
            accent={TEAL}
          />
          <StatCard
            label="Total Appointments"
            value={totalAppointments}
            icon="lucide:calendar-check"
            loading={isLoading}
            accent={BLUE}
          />
        </div>

        {/* Chart */}
        <CardPanel title="Completion vs Cancellation Rate" icon="lucide:bar-chart-3">
          <div className="p-6">
            {isLoading ? (
              <div className="flex h-[280px] items-center justify-center">
                <Icon icon="line-md:loading-twotone-loop" width={24} className="text-[#92CDFD]" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center">
                <EmptyBlock label="No performance data in this period" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#C1C7CF' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#C1C7CF' }}
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      fontSize: 12,
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: '#1D2023',
                      color: '#fff',
                    }}
                    formatter={(value, name) => [`${value}%`, String(name)]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#C1C7CF' }} />
                  <Bar dataKey="completion" name="Completion" fill={TEAL} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="cancellation" name="Cancellation" fill={BLUE} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardPanel>

        {/* Table */}
        <CardPanel title="Per-Doctor Breakdown" icon="lucide:table-2">
          {isLoading ? (
            <LoadingBlock label="Loading performance…" />
          ) : rows.length === 0 ? (
            <EmptyBlock label="No doctors with appointments in this period" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-[10px] font-bold uppercase tracking-[2px] text-[#8B9199]">
                    <th className="px-6 py-3">Doctor</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Completed</th>
                    <th className="px-4 py-3 text-right">Cancelled</th>
                    <th className="px-4 py-3 text-right">No-show</th>
                    <th className="px-4 py-3 text-right">Completion %</th>
                    <th className="px-4 py-3 text-right">Cancellation %</th>
                    <th className="px-6 py-3 text-right">Avg Dur (min)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map((r) => (
                    <tr key={r.doctor_id} className="transition-colors hover:bg-white/[0.03]">
                      <td className="px-6 py-3 font-medium text-white">{doctorName(r.doctor_id)}</td>
                      <td className="px-4 py-3 text-right text-[#C1C7CF]">{num(r.total_appointments)}</td>
                      <td className="px-4 py-3 text-right text-[#C1C7CF]">{num(r.completed)}</td>
                      <td className="px-4 py-3 text-right text-[#C1C7CF]">{num(r.cancelled)}</td>
                      <td className="px-4 py-3 text-right text-[#C1C7CF]">{num(r.no_show)}</td>
                      <td className="px-4 py-3 text-right font-semibold" style={{ color: TEAL }}>
                        {num(r.completion_rate_pct)}%
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-red-300">
                        {num(r.cancellation_rate_pct)}%
                      </td>
                      <td className="px-6 py-3 text-right text-[#C1C7CF]">
                        {Math.round(num(r.avg_duration_minutes))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardPanel>
      </div>
    </AppShell>
  );
}
