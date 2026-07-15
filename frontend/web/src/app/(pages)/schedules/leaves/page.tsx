'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

import { useSchedule } from '@/features/schedule/hooks/useSchedule';
import { LeaveRequestCard } from '@/features/schedule/components/LeaveRequestCard';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';
import { ROUTES } from '@/shared/constants/routes';
import type { LeaveStatus } from '@/features/schedule/types/schedule.type';

const STATUS_TABS: { value: LeaveStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STAT_CONFIG = [
  { status: 'PENDING' as LeaveStatus, icon: 'mdi:clock-outline', chipClass: 'bg-amber-100 text-amber-700', label: 'Pending' },
  { status: 'APPROVED' as LeaveStatus, icon: 'mdi:check-circle', chipClass: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
  { status: 'REJECTED' as LeaveStatus, icon: 'mdi:close-circle', chipClass: 'bg-red-100 text-red-700', label: 'Rejected' },
  { status: 'CANCELLED' as LeaveStatus, icon: 'mdi:cancel', chipClass: 'bg-slate-100 text-slate-600', label: 'Cancelled' },
];

export default function DoctorLeavesPage() {
  const {
    useDoctorLeaves,
    approveLeave,
    rejectLeave,
    isApprovingLeave,
    isRejectingLeave,
  } = useSchedule();
  const { user } = useAuthStore();

  const [filterStatus, setFilterStatus] = useState<LeaveStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [size] = useState(12);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading, error, refetch } = useDoctorLeaves({
    status: filterStatus === 'ALL' ? undefined : filterStatus,
    page,
    size,
  });

  const leaves = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;
  const allLeaves = data?.data?.content || [];

  const getStatusCount = (status: LeaveStatus) =>
    allLeaves.filter((l) => l.status === status).length;

  const handleApproveLeave = async (leaveId: string) => {
    if (!user?.userId) return;
    if (!confirm('Approve this leave request?')) return;
    try {
      await approveLeave({ leaveId, request: { approvedBy: user.userId } });
      refetch();
    } catch {
      alert('Failed to approve request');
    }
  };

  const handleRejectLeave = async () => {
    if (!selectedLeaveId || !rejectionReason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }
    try {
      await rejectLeave({ leaveId: selectedLeaveId, request: { rejectionReason } });
      setShowRejectDialog(false);
      setSelectedLeaveId(null);
      setRejectionReason('');
      refetch();
    } catch {
      alert('Failed to reject request');
    }
  };

  if (isLoading) return <Loading fullScreen text="Loading leave requests..." />;
  if (error) return <ErrorMessage message="Failed to load leave requests" onRetry={refetch} />;

  return (
    <div className="min-h-screen bg-[#E7ECEF]">
      {/* Teal gradient header */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-700 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-lg">
                <Icon icon="mdi:calendar-remove" width={30} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Leave Management</h1>
                <p className="text-teal-100 text-sm mt-0.5">Approve and manage leave requests</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-all text-sm"
              >
                <Icon icon="mdi:refresh" width={18} />
                Refresh
              </button>
              <Link
                href={ROUTES.DOCTOR_LEAVE_NEW}
                className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-white text-teal-700 font-semibold rounded-xl shadow-md hover:brightness-95 hover:-translate-y-px transition-all text-sm"
              >
                <Icon icon="mdi:plus" width={18} />
                Request Leave
              </Link>
            </div>
          </div>

          {/* Status segmented control */}
          <div className="inline-flex p-1 gap-0.5 bg-white/15 border border-white/20 rounded-full">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setFilterStatus(tab.value); setPage(0); }}
                className={
                  filterStatus === tab.value
                    ? 'px-4 min-h-[36px] rounded-full text-sm font-semibold bg-white text-teal-700 shadow-sm transition-all'
                    : 'px-4 min-h-[36px] rounded-full text-sm font-semibold text-white/80 hover:text-white transition-colors'
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STAT_CONFIG.map((s) => (
            <div
              key={s.status}
              className="bg-white rounded-2xl shadow-[6px_6px_14px_rgba(177,192,202,0.7),-6px_-6px_14px_rgba(255,255,255,1)] p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-3xl font-bold text-slate-900">{getStatusCount(s.status)}</p>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${s.chipClass}`}>
                  <Icon icon={s.icon} width={13} />
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Leave cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {leaves.map((leave) => (
            <LeaveRequestCard
              key={leave.doctorLeaveId}
              leave={leave}
              onApprove={() => handleApproveLeave(leave.doctorLeaveId)}
              onReject={() => {
                setSelectedLeaveId(leave.doctorLeaveId);
                setShowRejectDialog(true);
              }}
              showActions={leave.status === 'PENDING'}
            />
          ))}
        </div>

        {leaves.length === 0 && (
          <div className="flex flex-col items-center py-16 bg-white rounded-2xl shadow-[6px_6px_14px_rgba(177,192,202,0.7),-6px_-6px_14px_rgba(255,255,255,1)] text-slate-400">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
              <Icon icon="mdi:calendar-remove" width={36} className="text-teal-300" />
            </div>
            <p className="text-lg font-semibold text-slate-600">No leave requests</p>
            <p className="text-sm mt-1">Try a different filter</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] bg-white rounded-xl shadow-[4px_4px_10px_rgba(177,192,202,0.6),-4px_-4px_10px_rgba(255,255,255,1)] text-sm font-semibold text-slate-700 disabled:opacity-40 hover:-translate-y-px transition-all"
            >
              <Icon icon="mdi:chevron-left" width={18} />
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-slate-500">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] bg-white rounded-xl shadow-[4px_4px_10px_rgba(177,192,202,0.6),-4px_-4px_10px_rgba(255,255,255,1)] text-sm font-semibold text-slate-700 disabled:opacity-40 hover:-translate-y-px transition-all"
            >
              Next
              <Icon icon="mdi:chevron-right" width={18} />
            </button>
          </div>
        )}
      </div>

      {/* Reject dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-none">
                <Icon icon="mdi:close-circle" width={26} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Reject leave request</h3>
                <p className="text-sm text-slate-500">Please enter a reason</p>
              </div>
            </div>

            <textarea
              className="w-full min-h-[100px] px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] focus:outline-none focus:border-teal-500 text-sm mb-4 resize-none"
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
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-white font-semibold rounded-xl shadow-[4px_4px_10px_rgba(177,192,202,0.7),-4px_-4px_10px_rgba(255,255,255,1)] hover:-translate-y-px transition-all text-slate-700 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectLeave}
                disabled={!rejectionReason.trim() || isRejectingLeave}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-red-600 text-white font-semibold rounded-xl shadow-[0_8px_20px_-6px_rgba(220,38,38,0.45)] hover:bg-red-700 transition-all text-sm disabled:opacity-50"
              >
                {isRejectingLeave && <Icon icon="line-md:loading-twotone-loop" width={16} />}
                Confirm rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
