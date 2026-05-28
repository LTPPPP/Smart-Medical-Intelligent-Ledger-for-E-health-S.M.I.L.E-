'use client';
import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { format, parseISO, startOfDay } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { useAuthStore } from '@/features/auth/store/authStore';
import { useAdmin } from '@/features/admin/hooks/useAdmin';
import type { AuditLog } from '@/features/admin/types/admin.type';

const ACTION_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  LOGIN: { label: 'Login', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', icon: 'lucide:log-in' },
  LOGOUT: { label: 'Logout', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', icon: 'lucide:log-out' },
  REGISTER: { label: 'Register', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', icon: 'lucide:user-plus' },
};

const getActionMeta = (action: string) =>
  ACTION_META[action] ?? { label: action, color: 'text-smile-description', bg: 'bg-smile-description/10', icon: 'lucide:activity' };

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay },
});

const PAGE_SIZE = 10;

export default function AdminPage() {
  const { user } = useAuthStore();
  const { useUserProfiles, useRoles, useAuditLogs } = useAdmin();
  const [page, setPage] = useState(1);

  const { data: usersData } = useUserProfiles({ page: 1, limit: 1 });
  const { data: rolesData } = useRoles();
  const { data: auditData, isLoading: auditLoading } = useAuditLogs({ page, limit: PAGE_SIZE, action: undefined });
  // Fetch all logs for chart
  const { data: chartData } = useAuditLogs({ page: 1, limit: 200 });

  const totalUsers = usersData?.meta?.total ?? '--';
  const totalRoles = rolesData?.data?.length ?? '--';

  const stats = [
    { label: 'Total Users', value: String(totalUsers), icon: 'lucide:users', color: 'text-blue-500', accent: 'bg-blue-500/10 dark:bg-blue-500/15' },
    { label: 'Active Clinics', value: '--', icon: 'lucide:hospital', color: 'text-emerald-500', accent: 'bg-emerald-500/10 dark:bg-emerald-500/15' },
    { label: 'System Roles', value: String(totalRoles), icon: 'lucide:shield-check', color: 'text-violet-500', accent: 'bg-violet-500/10 dark:bg-violet-500/15' },
  ];

  // Build chart series: group login/logout by day
  const chartSeries = useMemo(() => {
    const logs: AuditLog[] = chartData?.data ?? [];
    const byDay: Record<string, { date: string; LOGIN: number; LOGOUT: number; REGISTER: number }> = {};
    for (const log of logs) {
      const day = format(startOfDay(parseISO(log.created_at)), 'MM/dd');
      if (!byDay[day]) byDay[day] = { date: day, LOGIN: 0, LOGOUT: 0, REGISTER: 0 };
      if (log.action === 'LOGIN') byDay[day].LOGIN++;
      else if (log.action === 'LOGOUT') byDay[day].LOGOUT++;
      else if (log.action === 'REGISTER') byDay[day].REGISTER++;
    }
    return Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
  }, [chartData]);

  const logs: AuditLog[] = auditData?.data ?? [];
  const total = auditData?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">

      {/* Welcome banner */}
      <motion.div {...fadeUp(0)}>
        <div
          className="relative overflow-hidden rounded-[28px] border backdrop-blur-xl"
          style={{ background: 'var(--surface-panel-bg)', borderColor: 'var(--surface-panel-border)', boxShadow: 'var(--surface-panel-shadow)' }}
        >
          <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-[28px]" style={{ background: 'var(--gradient-brand)' }} />
          <div className="pointer-events-none absolute inset-0 rounded-[28px]"
            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 50%)' }} />
          <div className="pointer-events-none absolute -bottom-10 right-0 h-56 w-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(65,126,170,0.18) 0%, transparent 70%)' }} />
          <div className="relative px-8 py-7">
            <p className="mb-1 font-inter text-[10px] font-semibold uppercase tracking-[3px] text-smile-description">Admin Panel</p>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-smile-primary/10">
                <Icon icon="lucide:shield-check" width={22} className="text-smile-primary" />
              </div>
              <div>
                <h1 className="font-poppins text-3xl font-semibold">
                  <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-brand)' }}>
                    Admin Dashboard
                  </span>
                </h1>
                <p className="font-inter text-sm text-smile-title">
                  Welcome back, <span className="font-semibold text-smile-primary">{user?.fullName ?? 'Admin'}</span>
                </p>
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-smile-primary/30 bg-smile-primary/10 px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-smile-primary shadow-[0_0_6px_rgba(65,126,170,0.8)]" />
              <span className="font-inter text-xs font-semibold text-smile-primary">Active session</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} {...fadeUp(0.1 + i * 0.08)}>
            <div
              className="relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all hover:scale-[1.02] hover:shadow-xl"
              style={{ background: 'var(--surface-card-bg)', borderColor: 'var(--surface-card-border)', boxShadow: 'var(--surface-card-shadow)' }}
            >
              <div className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 55%)' }} />
              <p className="font-inter text-[10px] font-semibold uppercase tracking-[2px] text-smile-description">{s.label}</p>
              <p className="mt-1.5 font-poppins text-3xl font-bold text-smile-primary-dark">{s.value}</p>
              <div className={`absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl ${s.accent}`}>
                <Icon icon={s.icon} width={18} className={s.color} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Activity chart */}
      <motion.div {...fadeUp(0.3)}>
        <div
          className="relative overflow-hidden rounded-[22px] border p-6 backdrop-blur-xl"
          style={{ background: 'var(--surface-card-bg)', borderColor: 'var(--surface-card-border)', boxShadow: 'var(--surface-card-shadow)' }}
        >
          <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-[22px]" style={{ background: 'var(--gradient-brand)' }} />
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-smile-primary/10">
              <Icon icon="lucide:activity" width={16} className="text-smile-primary" />
            </div>
            <p className="font-poppins text-sm font-semibold text-smile-primary-dark">Login &amp; Logout Activity</p>
            <span className="ml-auto font-inter text-[10px] font-semibold uppercase tracking-[2px] text-smile-description">Last 200 events</span>
          </div>
          {chartSeries.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-smile-description font-inter text-sm">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartSeries} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.15)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-smile-description, #94a3b8)' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-smile-description, #94a3b8)' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid rgba(100,116,139,0.2)', background: 'var(--surface-card-bg)' }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Line type="monotone" dataKey="LOGIN" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Login" />
                <Line type="monotone" dataKey="LOGOUT" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Logout" />
                <Line type="monotone" dataKey="REGISTER" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Register" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Audit Log list */}
      <motion.div {...fadeUp(0.4)}>
        <div
          className="relative overflow-hidden rounded-[22px] border backdrop-blur-xl"
          style={{ background: 'var(--surface-card-bg)', borderColor: 'var(--surface-card-border)', boxShadow: 'var(--surface-card-shadow)' }}
        >
          <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-[22px]" style={{ background: 'var(--gradient-brand)' }} />
          <div className="flex items-center gap-2 border-b px-6 py-4" style={{ borderColor: 'var(--surface-card-border)' }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-smile-primary/10">
              <Icon icon="lucide:scroll-text" width={16} className="text-smile-primary" />
            </div>
            <p className="font-poppins text-sm font-semibold text-smile-primary-dark">Audit Logs</p>
            <span className="ml-2 rounded-full bg-smile-primary/10 px-2.5 py-0.5 font-inter text-[11px] font-semibold text-smile-primary">
              {total}
            </span>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[140px_1fr_160px_180px_150px] gap-4 border-b px-6 py-2.5 font-inter text-[10px] font-bold uppercase tracking-[2px] text-smile-description"
            style={{ borderColor: 'var(--surface-card-border)' }}>
            <span>Action</span>
            <span>User</span>
            <span>IP Address</span>
            <span>User Agent</span>
            <span>Time</span>
          </div>

          {/* Rows */}
          {auditLoading ? (
            <div className="flex items-center justify-center py-12">
              <Icon icon="lucide:loader-2" width={22} className="animate-spin text-smile-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-smile-description">
              <Icon icon="lucide:inbox" width={28} />
              <p className="font-inter text-sm">No audit logs found</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--surface-card-border)' }}>
              {logs.map((log) => {
                const meta = getActionMeta(log.action);
                const timeStr = (() => {
                  try { return format(parseISO(log.created_at), 'dd/MM HH:mm:ss'); } catch { return log.created_at; }
                })();
                const ua = log.user_agent ?? '—';
                const shortUa = ua.length > 32 ? ua.slice(0, 32) + '…' : ua;
                return (
                  <div
                    key={log.log_id}
                    className="grid grid-cols-[140px_1fr_160px_180px_150px] items-center gap-4 px-6 py-3 transition-colors hover:bg-smile-primary/5"
                  >
                    {/* Action badge */}
                    <div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-inter text-[11px] font-semibold ${meta.bg} ${meta.color}`}>
                        <Icon icon={meta.icon} width={11} />
                        {meta.label}
                      </span>
                    </div>
                    {/* User */}
                    <div className="min-w-0">
                      <p className="truncate font-inter text-sm font-medium text-smile-primary-dark">
                        {log.full_name ?? <span className="italic text-smile-description">Unknown</span>}
                      </p>
                      {log.details?.email && (
                        <p className="truncate font-inter text-[11px] text-smile-description">{String(log.details.email)}</p>
                      )}
                    </div>
                    {/* IP */}
                    <p className="truncate font-inter text-xs text-smile-description">{log.ip_address ?? '—'}</p>
                    {/* UA */}
                    <p className="truncate font-inter text-xs text-smile-description" title={ua}>{shortUa}</p>
                    {/* Time */}
                    <p className="font-inter text-xs text-smile-description">{timeStr}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-6 py-3" style={{ borderColor: 'var(--surface-card-border)' }}>
              <p className="font-inter text-xs text-smile-description">
                Page {page} of {totalPages} · {total} entries
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border text-smile-description transition-colors hover:bg-smile-primary/10 hover:text-smile-primary disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ borderColor: 'var(--surface-card-border)' }}
                >
                  <Icon icon="lucide:chevron-left" width={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border text-smile-description transition-colors hover:bg-smile-primary/10 hover:text-smile-primary disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ borderColor: 'var(--surface-card-border)' }}
                >
                  <Icon icon="lucide:chevron-right" width={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
