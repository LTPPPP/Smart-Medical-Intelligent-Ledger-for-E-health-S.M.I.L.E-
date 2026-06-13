'use client';

import { Icon } from '@iconify/react';

import { cn } from '@/shared/lib/utils';

import { DoctorLeave, LeaveType, LeaveStatus } from '../types/schedule.type';

interface LeaveRequestCardProps {
  leave: DoctorLeave;
  onApprove?: () => void;
  onReject?: () => void;
  onClick?: () => void;
  showActions?: boolean;
}

export const LeaveRequestCard = ({
  leave,
  onApprove,
  onReject,
  onClick,
  showActions = false,
}: LeaveRequestCardProps) => {
  const getLeaveTypeConfig = (type: LeaveType) => {
    const configs = {
      ANNUAL: { icon: 'mdi:beach', label: 'Annual Leave', color: 'blue' },
      SICK: { icon: 'mdi:medical-bag', label: 'Sick Leave', color: 'red' },
      EMERGENCY: { icon: 'mdi:alert', label: 'Emergency', color: 'orange' },
      UNPAID: { icon: 'mdi:cash-remove', label: 'Unpaid Leave', color: 'gray' },
      OTHER: { icon: 'mdi:dots-horizontal', label: 'Other', color: 'purple' },
    };
    return configs[type] || configs.OTHER;
  };

  const getStatusConfig = (status: LeaveStatus) => {
    const configs = {
      PENDING: {
        color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        icon: 'mdi:clock-outline',
      },
      APPROVED: {
        color: 'bg-green-50 border-green-200 text-green-800',
        icon: 'mdi:check-circle',
      },
      REJECTED: {
        color: 'bg-red-50 border-red-200 text-red-800',
        icon: 'mdi:close-circle',
      },
      CANCELLED: {
        color: 'bg-smile-footer-bg border-smile-border/50 text-smile-title',
        icon: 'mdi:cancel',
      },
    };
    return configs[status];
  };

  const typeConfig = getLeaveTypeConfig(leave.leaveType);
  const statusConfig = getStatusConfig(leave.status);

  const calculateDuration = () => {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border-2 p-6 transition-all hover:shadow-[0_8px_24px_rgba(65,126,170,0.10)]',
        onClick && 'cursor-pointer',
        statusConfig.color,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              `bg-${typeConfig.color}-100`,
            )}
          >
            <Icon
              icon={typeConfig.icon}
              width={24}
              className={`text-${typeConfig.color}-600`}
            />
          </div>
          <div>
            <h3 className="font-bold text-lg">
              {leave.doctorName || 'Doctor'}
            </h3>
            <p className="text-sm opacity-75">{typeConfig.label}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Icon icon={statusConfig.icon} width={20} />
          <span className="font-semibold">{leave.status}</span>
        </div>
      </div>

      {/* Date Range */}
      <div className="bg-white bg-opacity-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Icon icon="mdi:calendar-start" width={18} className="opacity-60" />
            <span className="font-medium">{leave.startDate}</span>
          </div>
          <Icon icon="mdi:arrow-right" width={20} className="opacity-40" />
          <div className="flex items-center gap-2 text-sm">
            <Icon icon="mdi:calendar-end" width={18} className="opacity-60" />
            <span className="font-medium">{leave.endDate}</span>
          </div>
        </div>
        <p className="text-center text-sm mt-2 font-semibold">
          {calculateDuration()} day{calculateDuration() > 1 ? 's' : ''}
        </p>
      </div>

      {/* Reason */}
      <div className="mb-4">
        <div className="text-sm font-medium mb-1 opacity-60">Reason:</div>
        <p className="text-sm">{leave.reason}</p>
      </div>

      {/* Approval Info */}
      {leave.status === 'APPROVED' && leave.approverName && (
        <div className="bg-green-50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-green-800">
            <Icon icon="mdi:account-check" width={18} />
            <span>
              Approved by <strong>{leave.approverName}</strong>
            </span>
          </div>
          {leave.approvedAt && (
            <p className="text-xs text-green-600 mt-1">
              on {new Date(leave.approvedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Rejection Info */}
      {leave.status === 'REJECTED' && leave.rejectionReason && (
        <div className="bg-red-50 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-red-800 mb-1">
            <Icon icon="mdi:close-circle" width={18} />
            <span className="font-medium">Rejection Reason:</span>
          </div>
          <p className="text-sm text-red-700">{leave.rejectionReason}</p>
        </div>
      )}

      {/* Actions */}
      {showActions && leave.status === 'PENDING' && (
        <div className="flex gap-2 pt-4 border-t">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApprove?.();
            }}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <Icon icon="mdi:check" width={18} />
            <span>Approve</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReject?.();
            }}
            className="flex-1 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <Icon icon="mdi:close" width={18} />
            <span>Reject</span>
          </button>
        </div>
      )}
    </div>
  );
};
