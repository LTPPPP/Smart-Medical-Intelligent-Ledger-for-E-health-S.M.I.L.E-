'use client';

import { useMemo, useState } from 'react';

import { Icon } from '@iconify/react';

import { LeaveRequestCard } from '@/features/schedule/components/LeaveRequestCard';
import { useSchedule } from '@/features/schedule/hooks/useSchedule';
import type { LeaveStatus } from '@/features/schedule/types/schedule.type';
import { CalendarView, type CalendarEvent } from '@/shared/components/common/CalendarView';
import { Loading } from '@/shared/components/common/Loading';
import { ViewToggle, type ViewMode } from '@/shared/components/common/ViewToggle';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';
import { ROUTES } from '@/shared/constants/routes';

const cardBase = 'rounded-[20px] border backdrop-blur-xl [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]';

const LEAVE_CAL_TONE: Record<string, string> = {
  PENDING: 'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  APPROVED: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  REJECTED: 'bg-red-500/15 text-red-600 dark:text-red-300',
  CANCELLED: 'bg-slate-400/20 text-slate-600 dark:text-slate-300',
};

const STATUS_TABS: { value: LeaveStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STAT_CONFIG = [
  { status: 'PENDING' as LeaveStatus, icon: 'mdi:clock-outline', chipClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-300', label: 'Pending' },
  { status: 'APPROVED' as LeaveStatus, icon: 'mdi:check-circle', chipClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300', label: 'Approved' },
  { status: 'REJECTED' as LeaveStatus, icon: 'mdi:close-circle', chipClass: 'bg-red-500/15 text-red-600 dark:text-red-300', label: 'Rejected' },
  { status: 'CANCELLED' as LeaveStatus, icon: 'mdi:cancel', chipClass: 'bg-slate-400/20 text-slate-600 dark:text-slate-300', label: 'Cancelled' },
];

export default function DoctorLeavesPage() {
  const {
    useDoctorLeaves,
    approveLeave,
    rejectLeave,
    isRejectingLeave,
  } = useSchedule();

  const [filterStatus, setFilterStatus] = useState<LeaveStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [view, setView] = useState<ViewMode>('list');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading, error, refetch } = useDoctorLeaves({
    status: filterStatus === 'ALL' ? undefined : filterStatus,
    page,
    size,
  });

  const leaves = useMemo(() => data?.data?.content ?? [], [data]);
  const totalPages = data?.data?.totalPages || 0;

  const calendarEvents = useMemo<CalendarEvent[]>(
    () =>
      leaves
        .filter((l) => l.startDate)
        .map((l) => ({
          id: l.doctorLeaveId,
          date: l.startDate,
          endDate: l.endDate,
          label: l.doctorName ?? l.leaveType ?? 'Leave',
          meta: l.status,
          tone: LEAVE_CAL_TONE[l.status],
        })),
    [leaves],
  );

  const getStatusCount = (status: LeaveStatus) =>
    leaves.filter((l) => l.status === status).length;

  const handleApproveLeave = async (leaveId: string) => {
    if (!confirm('Approve this leave request?')) return;
    try {
      await approveLeave({ leaveId, request: { approvedBy: 'CURRENT_USER_ID' } });
      refetch();
    } catch {
      alert('Failed to approve the request.');
    }
  };

  const handleRejectLeave = async () => {
    if (!selectedLeaveId || !rejectionReason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }
    try {
      await rejectLeave({ leaveId: selectedLeaveId, request: { rejectionReason } });
      setShowRejectDialog(false);
      setSelectedLeaveId(null);
      setRejectionReason('');
      refetch();
    } catch {
      alert('Failed to reject the request.');
    }
  };

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-poppins text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark">Leave Management</h1>
            <p className="font-inter text-sm text-smile-description">Review and manage doctor leave requests</p>
          </div>
          <div className="flex items-center gap-2">
            <ViewToggle mode={view} onChange={setView} />
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 rounded-full border [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)] px-4 py-2 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 hover:text-smile-primary"
            >
              <Icon icon="lucide:refresh-cw" width={15} /> Refresh
            </button>
          </div>
        </div>

        {isLoading && <Loading text="Loading leave requests..." />}
        {error && !isLoading && <ErrorMessage message="Failed to load leave requests." onRetry={refetch} />}

        {!isLoading && !error && (
          <>
            {/* Filters + stat cards */}
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map((tab) => {
                const active = filterStatus === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => { setFilterStatus(tab.value); setPage(0); }}
                    className={`rounded-full border px-3.5 py-1.5 font-inter text-xs font-semibold transition ${
                      active
                        ? 'border-smile-primary bg-smile-primary text-white'
                        : 'border-smile-primary/15 bg-smile-primary-light/40 text-smile-title hover:border-smile-primary/40'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {STAT_CONFIG.map((s) => (
                <div key={s.status} className={`${cardBase} p-5`}>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-3xl font-bold text-smile-title">{getStatusCount(s.status)}</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${s.chipClass}`}>
                      <Icon icon={s.icon} width={13} />
                      {s.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Calendar view */}
            {view === 'calendar' && (
              <CalendarView
                events={calendarEvents}
                onEventClick={(id) => { window.location.href = ROUTES.DOCTOR_LEAVE_DETAIL(id); }}
              />
            )}

            {/* Leave cards grid */}
            {view === 'list' && leaves.length > 0 && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {leaves.map((leave) => (
                  <LeaveRequestCard
                    key={leave.doctorLeaveId}
                    leave={leave}
                    onApprove={() => handleApproveLeave(leave.doctorLeaveId)}
                    onReject={() => {
                      setSelectedLeaveId(leave.doctorLeaveId);
                      setShowRejectDialog(true);
                    }}
                    onClick={() => {
                      window.location.href = ROUTES.DOCTOR_LEAVE_DETAIL(leave.doctorLeaveId);
                    }}
                    showActions={leave.status === 'PENDING'}
                  />
                ))}
              </div>
            )}

            {view === 'list' && leaves.length === 0 && (
              <div className={`${cardBase} flex flex-col items-center py-16 text-smile-description`}>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-smile-primary-light">
                  <Icon icon="mdi:calendar-remove" width={36} className="text-smile-primary" />
                </div>
                <p className="text-lg font-semibold text-smile-title">No leave requests</p>
                <p className="mt-1 text-sm">Try a different filter.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="inline-flex items-center gap-1.5 rounded-xl border [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)] px-4 py-2.5 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 disabled:opacity-40"
                >
                  <Icon icon="mdi:chevron-left" width={18} /> Prev
                </button>
                <span className="px-4 py-2 text-sm text-smile-description">
                  Page {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="inline-flex items-center gap-1.5 rounded-xl border [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)] px-4 py-2.5 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40 disabled:opacity-40"
                >
                  Next <Icon icon="mdi:chevron-right" width={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Reject dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowRejectDialog(false)}>
          <div className={`${cardBase} w-full max-w-md p-6 shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-red-500/15">
                <Icon icon="mdi:close-circle" width={26} className="text-red-600 dark:text-red-300" />
              </div>
              <div>
                <h3 className="font-poppins text-lg font-bold text-smile-title">Reject leave request</h3>
                <p className="text-sm text-smile-description">Please provide a reason</p>
              </div>
            </div>

            <textarea
              className="mb-4 min-h-[100px] w-full resize-none rounded-xl border [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)] px-4 py-3 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-smile-primary/50"
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setSelectedLeaveId(null);
                  setRejectionReason('');
                }}
                className="flex-1 rounded-xl border [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)] px-4 py-2.5 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectLeave}
                disabled={!rejectionReason.trim() || isRejectingLeave}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isRejectingLeave && <Icon icon="line-md:loading-twotone-loop" width={16} />}
                Confirm rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

