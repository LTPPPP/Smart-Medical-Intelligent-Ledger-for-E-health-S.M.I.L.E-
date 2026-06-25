'use client';

import { useMemo, useState } from 'react';

import { Icon } from '@iconify/react';
import { motion, type Transition } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { useRevenue } from '@/features/revenue/hooks/useRevenue';
import type { RevenueReport } from '@/features/revenue/types/revenue.type';

const smoothEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = (
  delay = 0,
): {
  initial: { opacity: number; y: number };
  animate: { opacity: number; y: number };
  transition: Transition;
} => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: smoothEase, delay },
});

const toISODate = (d: Date) => d.toISOString().split('T')[0];

const formatCurrency = (value: number, currency = 'VND') => {
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString('vi-VN')} ${currency}`;
  }
};

const defaultRange = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: toISODate(from), to: toISODate(to) };
};

export default function RevenueReportsPage() {
  const initial = useMemo(defaultRange, []);
  const [dateFrom, setDateFrom] = useState(initial.from);
  const [dateTo, setDateTo] = useState(initial.to);

  const { data, isLoading, error, refetch, isFetching } = useRevenue({
    date_from: dateFrom,
    date_to: dateTo,
  });

  const report: RevenueReport | undefined = data?.data;
  const currency = report?.totals.currency ?? 'VND';

  const stats = [
    {
      label: 'Total Revenue',
      value: report ? formatCurrency(report.totals.total_revenue, currency) : '--',
      icon: 'lucide:wallet',
      color: 'text-emerald-500',
      accent: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    },
    {
      label: 'Paid Appointments',
      value: report ? String(report.totals.paid_count) : '--',
      icon: 'lucide:badge-check',
      color: 'text-blue-500',
      accent: 'bg-blue-500/10 dark:bg-blue-500/15',
    },
    {
      label: 'Currency',
      value: currency,
      icon: 'lucide:coins',
      color: 'text-violet-500',
      accent: 'bg-violet-500/10 dark:bg-violet-500/15',
    },
  ];

  const byDayChart = useMemo(
    () =>
      (report?.by_day ?? []).map((d) => ({
        date: d.date.slice(5),
        revenue: d.revenue,
        count: d.count,
      })),
    [report],
  );

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <motion.div {...fadeUp(0)}>
        <div
          className="relative overflow-hidden rounded-[28px] border backdrop-blur-xl"
          style={{
            background: 'var(--surface-panel-bg)',
            borderColor: 'var(--surface-panel-border)',
            boxShadow: 'var(--surface-panel-shadow)',
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-[3px] rounded-t-[28px]"
            style={{ background: 'var(--gradient-brand)' }}
          />
          <div className="relative px-8 py-7">
            <p className="mb-1 font-inter text-[10px] font-semibold uppercase tracking-[3px] text-smile-description">
              Financial Report
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-smile-primary/10">
                <Icon icon="lucide:line-chart" width={22} className="text-smile-primary" />
              </div>
              <div>
                <h1 className="font-poppins text-3xl font-semibold">
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: 'var(--gradient-brand)' }}
                  >
                    Revenue Reports
                  </span>
                </h1>
                <p className="font-inter text-sm text-smile-title">
                  Revenue aggregated from paid appointments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div {...fadeUp(0.06)}>
        <div
          className="flex flex-wrap items-end gap-4 rounded-2xl border p-5 backdrop-blur-xl"
          style={{
            background: 'var(--surface-card-bg)',
            borderColor: 'var(--surface-card-border)',
            boxShadow: 'var(--surface-card-shadow)',
          }}
        >
          <div className="flex flex-col gap-1">
            <label
              htmlFor="date-from"
              className="font-inter text-[10px] font-semibold uppercase tracking-[2px] text-smile-description"
            >
              From
            </label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-xl border px-3 py-2 font-inter text-sm text-smile-primary-dark outline-none transition focus:border-smile-primary"
              style={{ borderColor: 'var(--surface-card-border)' }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="date-to"
              className="font-inter text-[10px] font-semibold uppercase tracking-[2px] text-smile-description"
            >
              To
            </label>
            <input
              id="date-to"
              type="date"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl border px-3 py-2 font-inter text-sm text-smile-primary-dark outline-none transition focus:border-smile-primary"
              style={{ borderColor: 'var(--surface-card-border)' }}
            />
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-smile-primary px-4 py-2.5 font-inter text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <Icon
              icon={isFetching ? 'lucide:loader-2' : 'lucide:refresh-cw'}
              width={15}
              className={isFetching ? 'animate-spin' : ''}
            />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Error state */}
      {error && (
        <motion.div
          {...fadeUp(0.1)}
          className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800"
        >
          <Icon icon="lucide:alert-triangle" width={18} className="text-red-600" />
          <p className="font-inter text-sm">
            Failed to load revenue report. Please try again.
          </p>
        </motion.div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} {...fadeUp(0.1 + i * 0.06)}>
            <div
              className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all hover:scale-[1.02] hover:shadow-xl"
              style={{
                background: 'var(--surface-card-bg)',
                borderColor: 'var(--surface-card-border)',
                boxShadow: 'var(--surface-card-shadow)',
              }}
            >
              <p className="font-inter text-[10px] font-semibold uppercase tracking-[2px] text-smile-description">
                {s.label}
              </p>
              <p className="mt-1.5 font-poppins text-2xl font-bold text-smile-primary-dark">
                {isLoading ? '—' : s.value}
              </p>
              <div
                className={`absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl ${s.accent}`}
              >
                <Icon icon={s.icon} width={18} className={s.color} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue by day chart */}
      <motion.div {...fadeUp(0.28)}>
        <div
          className="relative overflow-hidden rounded-[22px] border p-6 backdrop-blur-xl"
          style={{
            background: 'var(--surface-card-bg)',
            borderColor: 'var(--surface-card-border)',
            boxShadow: 'var(--surface-card-shadow)',
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-[2px] rounded-t-[22px]"
            style={{ background: 'var(--gradient-brand)' }}
          />
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-smile-primary/10">
              <Icon icon="lucide:bar-chart-3" width={16} className="text-smile-primary" />
            </div>
            <p className="font-poppins text-sm font-semibold text-smile-primary-dark">
              Revenue by Day
            </p>
          </div>
          {isLoading ? (
            <div className="flex h-[240px] items-center justify-center">
              <Icon icon="lucide:loader-2" width={22} className="animate-spin text-smile-primary" />
            </div>
          ) : byDayChart.length === 0 ? (
            <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-smile-description">
              <Icon icon="lucide:inbox" width={28} />
              <p className="font-inter text-sm">No revenue in this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byDayChart} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--color-smile-description, #94a3b8)' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-smile-description, #94a3b8)' }}
                  tickFormatter={(v: number) => Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(v)}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    fontSize: 12,
                    border: '1px solid rgba(100,116,139,0.2)',
                    background: 'var(--surface-card-bg)',
                  }}
                  labelStyle={{ fontWeight: 600 }}
                  formatter={(value: number) => [formatCurrency(value, currency), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* By service + by clinic tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* By service */}
        <motion.div {...fadeUp(0.34)}>
          <div
            className="relative h-full overflow-hidden rounded-[22px] border backdrop-blur-xl"
            style={{
              background: 'var(--surface-card-bg)',
              borderColor: 'var(--surface-card-border)',
              boxShadow: 'var(--surface-card-shadow)',
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-[2px] rounded-t-[22px]"
              style={{ background: 'var(--gradient-brand)' }}
            />
            <div
              className="flex items-center gap-2 border-b px-6 py-4"
              style={{ borderColor: 'var(--surface-card-border)' }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-smile-primary/10">
                <Icon icon="lucide:stethoscope" width={16} className="text-smile-primary" />
              </div>
              <p className="font-poppins text-sm font-semibold text-smile-primary-dark">
                Revenue by Service
              </p>
            </div>
            <RevenueRows
              loading={isLoading}
              rows={(report?.by_service ?? []).map((s) => ({
                key: s.service_id ?? s.service_name,
                name: s.service_name,
                revenue: s.revenue,
                count: s.count,
              }))}
              currency={currency}
            />
          </div>
        </motion.div>

        {/* By clinic */}
        <motion.div {...fadeUp(0.4)}>
          <div
            className="relative h-full overflow-hidden rounded-[22px] border backdrop-blur-xl"
            style={{
              background: 'var(--surface-card-bg)',
              borderColor: 'var(--surface-card-border)',
              boxShadow: 'var(--surface-card-shadow)',
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-[2px] rounded-t-[22px]"
              style={{ background: 'var(--gradient-brand)' }}
            />
            <div
              className="flex items-center gap-2 border-b px-6 py-4"
              style={{ borderColor: 'var(--surface-card-border)' }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-smile-primary/10">
                <Icon icon="lucide:hospital" width={16} className="text-smile-primary" />
              </div>
              <p className="font-poppins text-sm font-semibold text-smile-primary-dark">
                Revenue by Clinic
              </p>
            </div>
            <RevenueRows
              loading={isLoading}
              rows={(report?.by_clinic ?? []).map((c) => ({
                key: c.clinic_id ?? c.clinic_name,
                name: c.clinic_name,
                revenue: c.revenue,
                count: c.count,
              }))}
              currency={currency}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function RevenueRows({
  loading,
  rows,
  currency,
}: {
  loading: boolean;
  rows: { key: string; name: string; revenue: number; count: number }[];
  currency: string;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Icon icon="lucide:loader-2" width={22} className="animate-spin text-smile-primary" />
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-smile-description">
        <Icon icon="lucide:inbox" width={28} />
        <p className="font-inter text-sm">No data</p>
      </div>
    );
  }
  return (
    <>
      <div
        className="grid grid-cols-[1fr_120px_90px] gap-4 border-b px-6 py-2.5 font-inter text-[10px] font-bold uppercase tracking-[2px] text-smile-description"
        style={{ borderColor: 'var(--surface-card-border)' }}
      >
        <span>Name</span>
        <span className="text-right">Revenue</span>
        <span className="text-right">Count</span>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--surface-card-border)' }}>
        {rows.map((r) => (
          <div
            key={r.key}
            className="grid grid-cols-[1fr_120px_90px] items-center gap-4 px-6 py-3 transition-colors hover:bg-smile-primary/5"
          >
            <p className="truncate font-inter text-sm font-medium text-smile-primary-dark">{r.name}</p>
            <p className="text-right font-inter text-sm font-semibold text-emerald-600">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency,
                maximumFractionDigits: 0,
              }).format(r.revenue)}
            </p>
            <p className="text-right font-inter text-xs text-smile-description">{r.count}</p>
          </div>
        ))}
      </div>
    </>
  );
}
