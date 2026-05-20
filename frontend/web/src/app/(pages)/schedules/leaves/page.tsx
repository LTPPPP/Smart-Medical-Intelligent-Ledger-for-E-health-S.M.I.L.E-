'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

import { useSchedule } from '@/features/schedule/hooks/useSchedule';
import { LeaveRequestCard } from '@/features/schedule/components/LeaveRequestCard';
import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';
import { ROUTES } from '@/shared/constants/routes';
import type { LeaveStatus } from '@/features/schedule/types/schedule.type';

export default function DoctorLeavesPage() {
  const {
    useDoctorLeaves,
    approveLeave,
    rejectLeave,
    isApprovingLeave,
    isRejectingLeave,
  } = useSchedule();

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

  const handleApproveLeave = async (leaveId: string) => {
    if (!confirm('Are you sure you want to approve this leave request?'))
      return;

    try {
      await approveLeave({
        leaveId,
        request: { approvedBy: 'CURRENT_USER_ID' }, // Should get from auth context
      });
      refetch();
    } catch (err) {
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
    } catch (err) {
      alert('Failed to reject leave request');
    }
  };

  const getStatusCount = (status: LeaveStatus) => {
    return leaves.filter((leave) => leave.status === status).length;
  };

  if (isLoading) return <Loading fullScreen text="Loading leave requests..." />;
  if (error)
    return (
      <ErrorMessage message="Failed to load leave requests" onRetry={refetch} />
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Leave Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage doctor leave requests and approvals
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={ROUTES.DOCTOR_LEAVE_NEW}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Icon icon="mdi:plus" width={20} />
              Request Leave
            </Link>
            <button
              onClick={() => refetch()}
              className="border px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <Icon icon="mdi:refresh" width={20} />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { status: 'PENDING', icon: 'mdi:clock-outline', color: 'yellow' },
            { status: 'APPROVED', icon: 'mdi:check-circle', color: 'green' },
            { status: 'REJECTED', icon: 'mdi:close-circle', color: 'red' },
            { status: 'CANCELLED', icon: 'mdi:cancel', color: 'gray' },
          ].map(({ status, icon, color }) => (
            <div key={status} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full bg-${color}-100 flex items-center justify-center`}
                >
                  <Icon
                    icon={icon}
                    className={`text-${color}-600`}
                    width={24}
                  />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {getStatusCount(status as LeaveStatus)}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {status.toLowerCase()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="font-medium">Filter by Status:</label>
            <div className="flex gap-2">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() =>
                      setFilterStatus(status as LeaveStatus | 'ALL')
                    }
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      filterStatus === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
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
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
            <Icon
              icon="mdi:calendar-remove"
              className="mx-auto mb-3 text-gray-300"
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
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

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

            <p className="text-gray-600 mb-4">
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
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
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
    </div>
  );
}
