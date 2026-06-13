'use client';

import { useState } from 'react';

import { Icon } from '@iconify/react';

import { LeaveRequestCard } from '@/features/schedule/components/LeaveRequestCard';
import { useSchedule } from '@/features/schedule/hooks/useSchedule';
import type { LeaveStatus } from '@/features/schedule/types/schedule.type';
import { Loading } from '@/shared/components/common/Loading';
import { OperationsLayout, MetricCard } from '@/shared/components/layout/OperationsLayout';
import { ROUTES } from '@/shared/constants/routes';
import { demoLeaves } from '@/shared/data/clinicalDemoData';
import { toPage } from '@/shared/lib/apiShape';

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
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading, refetch } = useDoctorLeaves({
    status: filterStatus === 'ALL' ? undefined : filterStatus,
    page,
    size,
  });

  const pageData = toPage(data?.data, demoLeaves, page, size);
  const leaves = pageData.content;
  const totalPages = pageData.totalPages;

  const handleApproveLeave = async (leaveId: string) => {
    if (!confirm('Are you sure you want to approve this leave request?'))
      return;

    try {
      await approveLeave({
        leaveId,
        request: { approvedBy: 'CURRENT_USER_ID' }, // Should get from auth context
      });
      refetch();
    } catch {
      alert('Failed to approve leave request');
    }
  };

  const handleRejectLeave = async () => {
    if (!selectedLeaveId || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      await rejectLeave({
        leaveId: selectedLeaveId,
        request: { rejectionReason },
      });
      setShowRejectDialog(false);
      setSelectedLeaveId(null);
      setRejectionReason('');
      refetch();
    } catch {
      alert('Failed to reject leave request');
    }
  };

  const getStatusCount = (status: LeaveStatus) => {
    return leaves.filter((leave) => leave.status === status).length;
  };

  return (
    <OperationsLayout
      title="Doctor leaves"
      description="Review leave requests, approve or reject with a reason, and protect appointment coverage before conflicts happen."
      icon="lucide:calendar-off"
      actions={[
        { label: 'Request leave', href: ROUTES.DOCTOR_LEAVE_NEW, icon: 'lucide:plus', variant: 'primary' },
        { label: 'Doctor schedules', href: ROUTES.DOCTOR_SCHEDULES, icon: 'lucide:calendar-range' },
        { label: 'Refresh', icon: 'lucide:refresh-cw', onClick: () => refetch() },
      ]}
    >
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <MetricCard label="Pending" value={getStatusCount('PENDING')} detail="Needs review" tone="orange" />
        <MetricCard label="Approved" value={getStatusCount('APPROVED')} detail="Covered leave" tone="green" />
        <MetricCard label="Rejected" value={getStatusCount('REJECTED')} detail="Declined requests" tone="red" />
        <MetricCard label="Cancelled" value={getStatusCount('CANCELLED')} detail="Withdrawn requests" />
        </div>

        {/* Filters */}
        <div className="mt-5 border border-smile-border/50 bg-white p-4">
          <div className="flex items-center gap-4">
            <label className="font-medium">Filter by Status:</label>
            <div className="flex flex-wrap gap-2">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() =>
                      setFilterStatus(status as LeaveStatus | 'ALL')
                    }
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filterStatus === status
                        ? 'bg-smile-primary text-white'
                        : 'bg-smile-footer-bg text-smile-title hover:bg-smile-primary-light'
                    }`}
                  >
                    {status}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Leave Requests Grid */}
      {isLoading && <Loading text="Loading leave requests..." />}
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                window.location.href = ROUTES.DOCTOR_LEAVE_DETAIL(
                  leave.doctorLeaveId,
                );
              }}
              showActions={leave.status === 'PENDING'}
            />
          ))}
        </div>

        {leaves.length === 0 && (
          <div className="text-center py-12 text-smile-description bg-white border border-smile-border/50">
            <Icon
              icon="mdi:calendar-remove"
              className="mx-auto mb-3 text-smile-description/50"
              width={64}
            />
            <p className="text-xl font-medium">No leave requests found</p>
            <p className="text-sm mt-2">Try adjusting your filters</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 border rounded-lg hover:bg-smile-footer-bg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 border rounded-lg hover:bg-smile-footer-bg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Icon
                  icon="mdi:close-circle"
                  className="text-red-600"
                  width={24}
                />
              </div>
              <h3 className="text-xl font-bold">Reject Leave Request</h3>
            </div>

            <p className="text-smile-title mb-4">
              Please provide a reason for rejection:
            </p>

            <textarea
              className="w-full border rounded-lg p-3 mb-4 focus:ring-2 focus:ring-red-500"
              rows={4}
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowRejectDialog(false);
                  setSelectedLeaveId(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-smile-footer-bg"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectLeave}
                disabled={!rejectionReason.trim() || isRejectingLeave}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isRejectingLeave ? 'Rejecting...' : 'Reject Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </OperationsLayout>
  );
}
