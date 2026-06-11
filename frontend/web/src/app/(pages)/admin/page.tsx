'use client';
import { useMemo, useState } from 'react';

import Link from 'next/link';

import { Icon } from '@iconify/react';
import { format, parseISO, startOfDay } from 'date-fns';
import { motion, type Transition } from 'framer-motion';
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

import { useAdmin } from '@/features/admin/hooks/useAdmin';
import type { AdminKycRecord, AuditLog } from '@/features/admin/types/admin.type';
import {
  getAdditionalOcrFields,
  getTechnicalOcrPayload,
} from '@/features/admin/utils/kycOcrPayload';
import { useAuthStore } from '@/features/auth/store/authStore';
import { ROUTES } from '@/shared/constants';

const ACTION_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  LOGIN: { label: 'Login', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', icon: 'lucide:log-in' },
  LOGOUT: { label: 'Logout', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', icon: 'lucide:log-out' },
  REGISTER: { label: 'Register', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', icon: 'lucide:user-plus' },
};

const getActionMeta = (action: string) =>
  ACTION_META[action] ?? { label: action, color: 'text-smile-description', bg: 'bg-smile-description/10', icon: 'lucide:activity' };

const smoothEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = (delay = 0): {
  initial: { opacity: number; y: number };
  animate: { opacity: number; y: number };
  transition: Transition;
} => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: smoothEase, delay },
});

const PAGE_SIZE = 10;

type KycCheckStatus = 'PASS' | 'WARNING' | 'FAIL';
type KycReviewCheck = {
  code: string;
  label: string;
  status: KycCheckStatus;
  message: string;
};

const isKycReviewCheck = (value: unknown): value is KycReviewCheck => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.code === 'string' &&
    typeof item.label === 'string' &&
    typeof item.message === 'string' &&
    ['PASS', 'WARNING', 'FAIL'].includes(String(item.status))
  );
};

const getKycChecks = (record?: AdminKycRecord): KycReviewCheck[] => {
  const checks = record?.ocrPayload?.checks;
  return Array.isArray(checks) ? checks.filter(isKycReviewCheck) : [];
};

const getKycRiskLevel = (record?: AdminKycRecord) => {
  const risk = record?.ocrPayload?.riskLevel;
  return typeof risk === 'string' ? risk : undefined;
};

const getKycRiskReason = (record?: AdminKycRecord) => {
  const reason = record?.ocrPayload?.riskReason;
  return typeof reason === 'string' ? reason : undefined;
};

const getOcrText = (record?: AdminKycRecord) => {
  const rawText = record?.ocrPayload?.rawText;
  return typeof rawText === 'string' ? rawText : undefined;
};

const getOcrField = (record: AdminKycRecord | undefined, field: string) => {
  const value = record?.ocrPayload?.[field];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
};

const checkStyle: Record<KycCheckStatus, { icon: string; badge: string; row: string }> = {
  PASS: {
    icon: 'lucide:check-circle',
    badge: 'bg-green-100 text-green-700',
    row: 'border-green-100 bg-green-50',
  },
  WARNING: {
    icon: 'lucide:alert-triangle',
    badge: 'bg-amber-100 text-amber-700',
    row: 'border-amber-100 bg-amber-50',
  },
  FAIL: {
    icon: 'lucide:x-circle',
    badge: 'bg-red-100 text-red-700',
    row: 'border-red-100 bg-red-50',
  },
};

const needsManualAttention = (record?: AdminKycRecord) =>
  !record ||
  record.ocrStatus !== 'COMPLETED' ||
  typeof record.ocrConfidence !== 'number' ||
  record.ocrConfidence < 70;

export default function AdminPage() {
  const { user } = useAuthStore();
  const {
    useUserProfiles,
    useRoles,
    useAuditLogs,
    useKycReviews,
    useKycReview,
    useKycFile,
    approveKyc,
    rejectKyc,
    isReviewingKyc,
  } = useAdmin();
  const [page, setPage] = useState(1);
  const [selectedKycId, setSelectedKycId] = useState<string | undefined>();
  const [rejectReason, setRejectReason] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [selectedKycImage, setSelectedKycImage] = useState<{ label: string; src: string } | null>(null);

  const { data: usersData } = useUserProfiles({ page: 1, limit: 1 });
  const { data: rolesData } = useRoles();
  const { data: auditData, isLoading: auditLoading } = useAuditLogs({ page, limit: PAGE_SIZE, action: undefined });
  // Fetch all logs for chart
  const { data: chartData } = useAuditLogs({ page: 1, limit: 200 });
  const { data: kycReviews } = useKycReviews({ page: 1, limit: 5, status: 'PENDING_REVIEW' });
  const { data: selectedKyc, isLoading: isLoadingKycDetail } = useKycReview(selectedKycId);
  const { data: idFrontUrl } = useKycFile(selectedKycId, 'idFront');
  const { data: idBackUrl } = useKycFile(selectedKycId, 'idBack');
  const { data: selfieUrl } = useKycFile(selectedKycId, 'selfie');

  const totalUsers = usersData?.meta?.total ?? '--';
  const totalRoles = rolesData?.data?.length ?? '--';
  const pendingKyc = kycReviews?.meta?.total ?? 0;

  const stats = [
    { label: 'Total Users', value: String(totalUsers), icon: 'lucide:users', color: 'text-blue-500', accent: 'bg-blue-500/10 dark:bg-blue-500/15' },
    { label: 'Active Clinics', value: '--', icon: 'lucide:hospital', color: 'text-emerald-500', accent: 'bg-emerald-500/10 dark:bg-emerald-500/15' },
    { label: 'System Roles', value: String(totalRoles), icon: 'lucide:shield-check', color: 'text-violet-500', accent: 'bg-violet-500/10 dark:bg-violet-500/15' },
    { label: 'Pending KYC', value: String(pendingKyc), icon: 'lucide:id-card', color: 'text-amber-500', accent: 'bg-amber-500/10 dark:bg-amber-500/15' },
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
  const selectedKycNeedsAttention = needsManualAttention(selectedKyc);
  const selectedKycChecks = getKycChecks(selectedKyc);
  const selectedKycCheckCounts = selectedKycChecks.reduce(
    (summary, check) => ({
      ...summary,
      [check.status]: summary[check.status] + 1,
    }),
    { PASS: 0, WARNING: 0, FAIL: 0 } satisfies Record<KycCheckStatus, number>,
  );
  const selectedKycVisibleChecks = selectedKycChecks.filter((check) => check.status !== 'PASS');
  const selectedKycReviewChecks =
    selectedKycVisibleChecks.length > 0 ? selectedKycVisibleChecks : selectedKycChecks.slice(0, 3);
  const selectedKycRiskLevel = getKycRiskLevel(selectedKyc);
  const selectedKycRiskReason = getKycRiskReason(selectedKyc);
  const selectedKycRawText = getOcrText(selectedKyc);
  const selectedKycAdditionalFields = getAdditionalOcrFields(selectedKyc?.ocrPayload);
  const selectedKycTechnicalPayload = getTechnicalOcrPayload(selectedKyc?.ocrPayload);

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

      <motion.div
        {...fadeUp(0.08)}
        className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800 transition hover:bg-amber-100"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Icon icon="lucide:id-card" width={18} className="text-amber-600" />
          </div>
          <div>
            <p className="font-poppins text-sm font-semibold">Pending KYC Reviews</p>
            <p className="font-inter text-xs text-amber-700">Open the KYC workspace to review current and historical submissions.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-amber-500 px-3 py-1 font-inter text-xs font-bold text-white">
            {pendingKyc}
          </span>
          <Link
            href={ROUTES.ADMIN_KYC}
            className="rounded-lg bg-amber-700 px-3 py-2 font-inter text-xs font-semibold text-white"
          >
            Manage KYC
          </Link>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
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

      {/* KYC reviews */}
      <motion.div {...fadeUp(0.28)}>
        <div
          id="pending-kyc-reviews"
          className="relative overflow-hidden rounded-[22px] border backdrop-blur-xl"
          style={{ background: 'var(--surface-card-bg)', borderColor: 'var(--surface-card-border)', boxShadow: 'var(--surface-card-shadow)' }}
        >
          <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-[22px]" style={{ background: 'var(--gradient-brand)' }} />
          <div className="flex items-center gap-2 border-b px-6 py-4" style={{ borderColor: 'var(--surface-card-border)' }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10">
              <Icon icon="lucide:id-card" width={16} className="text-amber-500" />
            </div>
            <p className="font-poppins text-sm font-semibold text-smile-primary-dark">Pending KYC Reviews</p>
            <span className="ml-2 rounded-full bg-amber-500/10 px-2.5 py-0.5 font-inter text-[11px] font-semibold text-amber-600">
              {pendingKyc}
            </span>
          </div>
          {(kycReviews?.data?.length ?? 0) === 0 ? (
            <div className="flex items-center justify-center py-8 font-inter text-sm text-smile-description">No pending KYC reviews</div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--surface-card-border)' }}>
              {kycReviews?.data.map((record) => (
                <div key={record.kycId} className="grid grid-cols-[1fr_150px_130px_120px] items-center gap-4 px-6 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-inter text-sm font-medium text-smile-primary-dark">
                      {record.idType ?? 'Identity document'}
                    </p>
                    <p className="truncate font-inter text-xs text-smile-description">
                      {record.idNumberMasked ?? 'No masked ID'} · OCR {record.ocrConfidence ?? '—'}%
                    </p>
                  </div>
                  <span className="font-inter text-xs font-semibold text-amber-600">{record.status}</span>
                  <span className="font-inter text-xs text-smile-description">
                    {record.submittedAt ? format(parseISO(record.submittedAt), 'dd/MM HH:mm') : '—'}
                  </span>
                  <div className="flex justify-end gap-2">
                    <Link
                      href={ROUTES.ADMIN_KYC}
                      className="rounded-lg bg-smile-primary px-3 py-1.5 font-inter text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

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
                const email =
                  typeof log.details?.email === 'string' || typeof log.details?.email === 'number'
                    ? String(log.details.email)
                    : undefined;
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
                      {email && (
                        <p className="truncate font-inter text-[11px] text-smile-description">{email}</p>
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

      {selectedKycId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-8 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="font-poppins text-lg font-semibold text-slate-900">KYC Review</p>
                <p className="font-inter text-xs text-slate-500">{selectedKyc?.kycId ?? selectedKycId}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedKycId(undefined);
                  setRejectReason('');
                  setReviewError(null);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              >
                <Icon icon="lucide:x" width={18} />
              </button>
            </div>

            {isLoadingKycDetail ? (
              <div className="flex h-80 items-center justify-center">
                <Icon icon="lucide:loader-2" width={24} className="animate-spin text-smile-primary" />
              </div>
            ) : (
              <div className="max-h-[calc(92vh-78px)] overflow-y-auto p-6">
                <div
                  className={`mb-5 rounded-xl border px-4 py-3 font-inter text-sm ${
                    selectedKycNeedsAttention
                      ? 'border-amber-200 bg-amber-50 text-amber-900'
                      : 'border-green-200 bg-green-50 text-green-800'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <Icon
                        icon={selectedKycNeedsAttention ? 'lucide:shield-alert' : 'lucide:shield-check'}
                        width={16}
                        className="mt-0.5 shrink-0"
                      />
                      <div>
                        <p className="font-semibold">
                          {selectedKycNeedsAttention ? 'Manual attention recommended' : 'OCR signals look consistent'}
                        </p>
                        <p className="mt-1 text-xs leading-5">
                          Review identity documents only for KYC and booking safety. OCR is a helper signal, not automatic approval.
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold">
                      Retains until{' '}
                      {selectedKyc?.retentionExpiresAt ? format(parseISO(selectedKyc.retentionExpiresAt), 'dd/MM/yyyy') : 'policy expiry'}
                    </span>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="font-inter text-sm font-semibold text-slate-800">Automated Checks</p>
                          <p className="font-inter text-xs text-slate-500">
                            Showing warnings and failures first. Passing checks stay summarized.
                          </p>
                        </div>
                        {selectedKycRiskLevel && (
                          <span
                            className={`rounded-full px-3 py-1 font-inter text-xs font-bold ${
                              selectedKycRiskLevel === 'LOW'
                                ? 'bg-green-100 text-green-700'
                                : selectedKycRiskLevel === 'MEDIUM'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {selectedKycRiskLevel} RISK
                          </span>
                        )}
                      </div>
                      {selectedKycRiskReason && (
                        <p className="mb-3 rounded-lg bg-slate-50 p-3 font-inter text-xs text-slate-600">
                          {selectedKycRiskReason}
                        </p>
                      )}
                      <div className="mb-3 grid grid-cols-3 gap-2">
                        {([
                          ['PASS', selectedKycCheckCounts.PASS, 'text-green-700 bg-green-50'],
                          ['WARNING', selectedKycCheckCounts.WARNING, 'text-amber-700 bg-amber-50'],
                          ['FAIL', selectedKycCheckCounts.FAIL, 'text-red-700 bg-red-50'],
                        ] as const).map(([label, count, className]) => (
                          <div key={label} className={`rounded-lg px-3 py-2 text-center font-inter ${className}`}>
                            <p className="text-lg font-bold">{count}</p>
                            <p className="text-[10px] font-semibold uppercase tracking-[1.5px]">{label}</p>
                          </div>
                        ))}
                      </div>
                      {selectedKycChecks.length === 0 ? (
                        <p className="font-inter text-sm text-slate-500">No structured checks are available for this request.</p>
                      ) : (
                        <div className="grid gap-2">
                          {selectedKycReviewChecks.map((check) => {
                            const style = checkStyle[check.status];
                            return (
                              <div key={check.code} className={`rounded-lg border px-3 py-2 ${style.row}`}>
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex min-w-0 items-center gap-2">
                                    <Icon icon={style.icon} width={15} />
                                    <p className="truncate font-inter text-sm font-semibold text-slate-800">{check.label}</p>
                                  </div>
                                  <span className={`shrink-0 rounded-full px-2 py-0.5 font-inter text-[10px] font-bold ${style.badge}`}>
                                    {check.status}
                                  </span>
                                </div>
                                <p className="mt-1 font-inter text-xs text-slate-600">{check.message}</p>
                              </div>
                            );
                          })}
                          {selectedKycVisibleChecks.length === 0 && selectedKycChecks.length > selectedKycReviewChecks.length && (
                            <p className="rounded-lg bg-green-50 px-3 py-2 font-inter text-xs text-green-700">
                              {selectedKycChecks.length - selectedKycReviewChecks.length} more checks passed.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      {[
                        ['ID Front', idFrontUrl],
                        ['ID Back', idBackUrl],
                        ['Selfie', selfieUrl],
                      ].map(([label, src]) => (
                        <div key={label} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          <div className="border-b border-slate-200 px-3 py-2 font-inter text-xs font-semibold text-slate-700">
                            {label}
                          </div>
                          {typeof src === 'string' ? (
                            <button
                              type="button"
                              onClick={() => setSelectedKycImage({ label: String(label), src })}
                              className="block h-64 w-full bg-white transition hover:bg-slate-50"
                            >
                              <img src={src} alt={String(label)} className="h-full w-full object-contain" />
                            </button>
                          ) : (
                            <div className="flex h-64 items-center justify-center text-xs text-slate-500">
                              Loading image...
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="rounded-xl border border-slate-200">
                      <div className="border-b border-slate-200 px-4 py-3 font-inter text-sm font-semibold text-slate-800">
                        OCR Summary
                      </div>
                      <div className="space-y-4 p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          {[
                            ['ID number', getOcrField(selectedKyc, 'idNumber')],
                            ['Full name', getOcrField(selectedKyc, 'fullName')],
                            ['Date of birth', getOcrField(selectedKyc, 'dateOfBirth')],
                            ['Document type', getOcrField(selectedKyc, 'documentType')],
                            ['Issue date', getOcrField(selectedKyc, 'issueDate')],
                            ['Expiry date', getOcrField(selectedKyc, 'expiryDate')],
                            ['Origin', getOcrField(selectedKyc, 'placeOfOrigin')],
                            ['Residence', getOcrField(selectedKyc, 'placeOfResidence')],
                          ].map(([label, value]) => (
                            <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                              <p className="font-inter text-[11px] font-semibold uppercase tracking-[1.5px] text-slate-500">
                                {label}
                              </p>
                              <p className="mt-1 break-words font-inter text-sm font-semibold text-slate-900">
                                {value || '—'}
                              </p>
                            </div>
                          ))}
                        </div>

                        <details className="group rounded-lg border border-slate-200 bg-slate-50">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 font-inter text-xs font-semibold text-slate-700">
                            <span>Technical OCR details</span>
                            <span className="flex items-center gap-2 font-normal text-slate-500">
                              Raw text and payload
                              <Icon
                                icon="lucide:chevron-down"
                                width={16}
                                className="shrink-0 transition-transform group-open:rotate-180"
                              />
                            </span>
                          </summary>
                          <div className="space-y-3 border-t border-slate-200 bg-white p-3">
                            {selectedKycAdditionalFields.length > 0 && (
                              <div className="grid gap-2 md:grid-cols-2">
                                {selectedKycAdditionalFields.map((field) => (
                                  <div key={field.label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                                    <p className="font-inter text-[11px] font-semibold uppercase tracking-[1.5px] text-slate-500">
                                      {field.label}
                                    </p>
                                    <p className="mt-1 break-words font-inter text-sm font-semibold text-slate-900">
                                      {field.value}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                            <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-100 bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-700">
                              {selectedKycRawText || 'No raw OCR text available.'}
                            </pre>
                            {selectedKycTechnicalPayload && (
                              <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-100 bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-700">
                                {JSON.stringify(selectedKycTechnicalPayload, null, 2)}
                              </pre>
                            )}
                          </div>
                        </details>

                      </div>
                    </div>
                  </div>

                  <aside className="space-y-4">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="mb-3 font-inter text-sm font-semibold text-slate-800">Submitted Data</p>
                      <dl className="space-y-2 font-inter text-sm">
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">Type</dt>
                          <dd className="font-medium text-slate-900">{selectedKyc?.idType ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">ID</dt>
                          <dd className="font-medium text-slate-900">{selectedKyc?.idNumberMasked ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">Full name</dt>
                          <dd className="max-w-44 truncate font-medium text-slate-900">{selectedKyc?.fullName ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">DOB</dt>
                          <dd className="font-medium text-slate-900">{selectedKyc?.dateOfBirth ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">Status</dt>
                          <dd className="font-medium text-amber-600">{selectedKyc?.status ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">Submitted</dt>
                          <dd className="font-medium text-slate-900">
                            {selectedKyc?.submittedAt ? format(parseISO(selectedKyc.submittedAt), 'dd/MM/yyyy HH:mm') : '—'}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="mb-3 font-inter text-sm font-semibold text-slate-800">OCR Result</p>
                      <dl className="space-y-2 font-inter text-sm">
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">Status</dt>
                          <dd className="font-medium text-slate-900">{selectedKyc?.ocrStatus ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">Confidence</dt>
                          <dd className="font-medium text-slate-900">
                            {typeof selectedKyc?.ocrConfidence === 'number' ? `${selectedKyc.ocrConfidence}%` : '—'}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-500">Processed</dt>
                          <dd className="font-medium text-slate-900">
                            {selectedKyc?.ocrProcessedAt ? format(parseISO(selectedKyc.ocrProcessedAt), 'dd/MM/yyyy HH:mm') : '—'}
                          </dd>
                        </div>
                      </dl>
                      {selectedKyc?.ocrLastError && (
                        <p className="mt-3 rounded-lg bg-red-50 p-3 font-inter text-xs text-red-700">
                          {selectedKyc.ocrLastError}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <div className="sr-only" aria-live="polite">{reviewError ?? ''}</div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4">
                      <label className="mb-2 block font-inter text-sm font-semibold text-slate-800" htmlFor="kyc-reject-reason">
                        Reject reason
                      </label>
                      <textarea
                        id="kyc-reject-reason"
                        value={rejectReason}
                        onChange={(event) => {
                          setRejectReason(event.target.value);
                          setReviewError(null);
                        }}
                        rows={3}
                        placeholder="Tell the user what needs to be fixed."
                        className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 font-inter text-sm text-slate-900 outline-none transition focus:border-smile-primary"
                      />
                      <p className="mt-2 font-inter text-xs text-slate-500">
                        Minimum 3 characters. Required only when rejecting.
                      </p>
                      {reviewError && (
                        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 font-inter text-xs font-medium text-red-700">
                          {reviewError}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={isReviewingKyc}
                        onClick={async () => {
                          try {
                            setReviewError(null);
                            await approveKyc({ id: selectedKycId });
                            setSelectedKycId(undefined);
                            setRejectReason('');
                          } catch (error) {
                            setReviewError(error instanceof Error ? error.message : 'Failed to approve KYC.');
                          }
                        }}
                        className="flex-1 rounded-xl bg-green-600 px-4 py-3 font-inter text-sm font-semibold text-white disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={isReviewingKyc || rejectReason.trim().length < 3}
                        onClick={async () => {
                          const reason = rejectReason.trim();
                          if (reason.length < 3) {
                            setReviewError('Reject reason must be at least 3 characters.');
                            return;
                          }
                          try {
                            setReviewError(null);
                            await rejectKyc({ id: selectedKycId, request: { rejectionReason: reason } });
                            setSelectedKycId(undefined);
                            setRejectReason('');
                          } catch (error) {
                            setReviewError(error instanceof Error ? error.message : 'Failed to reject KYC.');
                          }
                        }}
                        className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-inter text-sm font-semibold text-white disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </aside>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedKycImage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
          <div className="grid max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl lg:grid-cols-[1.35fr_0.65fr]">
            <div className="flex min-h-[520px] flex-col bg-slate-950">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="font-poppins text-base font-semibold text-white">{selectedKycImage.label}</p>
                  <p className="font-inter text-xs text-slate-300">{selectedKyc?.kycId ?? selectedKycId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedKycImage(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 hover:bg-white/10"
                >
                  <Icon icon="lucide:x" width={18} />
                </button>
              </div>
              <div className="flex flex-1 items-center justify-center p-5">
                <img src={selectedKycImage.src} alt={selectedKycImage.label} className="max-h-[72vh] max-w-full object-contain" />
              </div>
            </div>

            <aside className="max-h-[92vh] overflow-y-auto p-5">
              <p className="mb-4 font-poppins text-base font-semibold text-slate-900">Submitted Data</p>
              <dl className="space-y-3 font-inter text-sm">
                {[
                  ['Type', selectedKyc?.idType],
                  ['ID', selectedKyc?.idNumberMasked],
                  ['Full name', selectedKyc?.fullName],
                  ['DOB', selectedKyc?.dateOfBirth],
                  ['Status', selectedKyc?.status],
                  ['OCR status', selectedKyc?.ocrStatus],
                  ['OCR confidence', typeof selectedKyc?.ocrConfidence === 'number' ? `${selectedKyc.ocrConfidence}%` : undefined],
                  ['Submitted', selectedKyc?.submittedAt ? format(parseISO(selectedKyc.submittedAt), 'dd/MM/yyyy HH:mm') : undefined],
                  ['Processed', selectedKyc?.ocrProcessedAt ? format(parseISO(selectedKyc.ocrProcessedAt), 'dd/MM/yyyy HH:mm') : undefined],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <dt className="font-inter text-[11px] font-semibold uppercase tracking-[1.5px] text-slate-500">{label}</dt>
                    <dd className="mt-1 break-words font-inter text-sm font-semibold text-slate-900">{value || '—'}</dd>
                  </div>
                ))}
              </dl>

              {selectedKycRiskLevel && (
                <div className="mt-4 rounded-xl border border-slate-200 p-3">
                  <p className="font-inter text-xs font-semibold text-slate-500">OCR Risk</p>
                  <p className="mt-1 font-inter text-sm font-bold text-slate-900">{selectedKycRiskLevel}</p>
                  {selectedKycRiskReason && (
                    <p className="mt-2 font-inter text-xs leading-5 text-slate-600">{selectedKycRiskReason}</p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelectedKycImage(null)}
                className="mt-5 w-full rounded-xl bg-smile-primary px-4 py-3 font-inter text-sm font-semibold text-white"
              >
                Back to review
              </button>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
