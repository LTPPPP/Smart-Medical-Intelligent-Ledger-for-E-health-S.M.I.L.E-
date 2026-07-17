'use client';

import { Icon } from '@iconify/react';

import type { DoctorSchedule, ScheduleStatus } from '../types/schedule.type';

const STATUS_CONFIG: Record<
  ScheduleStatus,
  { label: string; barColor: string; chipClass: string; icon: string }
> = {
  SCHEDULED: {
    label: 'Scheduled',
    barColor: 'bg-teal-500',
    chipClass: 'bg-teal-100 text-teal-700',
    icon: 'mdi:calendar-clock',
  },
  ACTIVE: {
    label: 'Active',
    barColor: 'bg-emerald-500',
    chipClass: 'bg-emerald-100 text-emerald-700',
    icon: 'mdi:calendar-check',
  },
  COMPLETED: {
    label: 'Completed',
    barColor: 'bg-slate-400',
    chipClass: 'bg-slate-100 text-slate-600',
    icon: 'mdi:calendar-check-outline',
  },
  CANCELLED: {
    label: 'Cancelled',
    barColor: 'bg-red-400',
    chipClass: 'bg-red-100 text-red-700',
    icon: 'mdi:calendar-remove',
  },
};

interface ScheduleCardProps {
  schedule: DoctorSchedule;
  onClick?: () => void;
  onCancel?: () => void;
  onComplete?: () => void;
  showActions?: boolean;
}

export function ScheduleCard({
  schedule,
  onClick,
  onCancel,
  onComplete,
  showActions = false,
}: ScheduleCardProps) {
  const status = STATUS_CONFIG[schedule.status] ?? STATUS_CONFIG.SCHEDULED;

  const formattedDate = schedule.workDate
    ? new Date(schedule.workDate).toLocaleDateString('vi-VN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <div
      className="bg-white rounded-2xl shadow-[4px_4px_10px_rgba(177,192,202,0.6),-4px_-4px_10px_rgba(255,255,255,1)] overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-all"
      onClick={onClick}
    >
      <div className="flex items-stretch">
        {/* Colored left bar */}
        <div className={`w-1.5 rounded-full my-3 ml-3 flex-none ${status.barColor}`} />

        {/* Main content */}
        <div className="flex-1 min-w-0 p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Date + shift info */}
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm">{formattedDate}</p>
              {schedule.shiftName && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {schedule.shiftName}
                  {schedule.shiftStartTime && schedule.shiftEndTime
                    ? ` · ${schedule.shiftStartTime.slice(0, 5)}–${schedule.shiftEndTime.slice(0, 5)}`
                    : ''}
                </p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {schedule.doctorName && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Icon icon="mdi:doctor" width={13} className="text-slate-400" />
                    {schedule.doctorName}
                  </span>
                )}
                {schedule.clinicName && (
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Icon icon="mdi:hospital-building" width={13} className="text-slate-400" />
                    {schedule.clinicName}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Icon icon="mdi:account-group" width={13} className="text-slate-400" />
                  Max {schedule.maxPatients}
                </span>
              </div>
              {schedule.notes && (
                <p className="text-xs text-slate-400 mt-1.5 line-clamp-1">{schedule.notes}</p>
              )}
            </div>

            {/* Status chip */}
            <div className="flex flex-col items-end gap-2 flex-none">
              <span
                className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold ${status.chipClass}`}
              >
                <Icon icon={status.icon} width={12} />
                {status.label}
              </span>
            </div>
          </div>

          {/* Actions */}
          {showActions && (schedule.status === 'SCHEDULED' || schedule.status === 'ACTIVE') && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
              {schedule.status === 'ACTIVE' && onComplete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[36px] bg-gradient-to-br from-teal-400 to-teal-600 text-white font-semibold rounded-xl shadow-[0_4px_10px_-4px_rgba(14,140,128,0.55)] hover:brightness-105 transition-all text-xs"
                >
                  <Icon icon="mdi:check" width={14} />
                  Complete
                </button>
              )}
              {onCancel && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 min-h-[36px] bg-white font-semibold rounded-xl shadow-[4px_4px_10px_rgba(177,192,202,0.7),-4px_-4px_10px_rgba(255,255,255,1)] hover:-translate-y-px transition-all text-slate-700 text-xs"
                >
                  <Icon icon="mdi:close" width={14} />
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
