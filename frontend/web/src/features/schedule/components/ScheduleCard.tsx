'use client';

import { Icon } from '@iconify/react';

import { cn } from '@/shared/lib/utils';

import { DoctorSchedule, ScheduleStatus } from '../types/schedule.type';

interface ScheduleCardProps {
  schedule: DoctorSchedule;
  onClick?: () => void;
  onCancel?: () => void;
  onComplete?: () => void;
  showActions?: boolean;
}

export const ScheduleCard = ({
  schedule,
  onClick,
  onCancel,
  onComplete,
  showActions = true,
}: ScheduleCardProps) => {
  const getStatusColor = (status: ScheduleStatus) => {
    const colors = {
      SCHEDULED: 'bg-smile-primary/5 border-smile-primary/25 text-smile-primary-dark',
      ACTIVE: 'bg-green-50 border-green-200 text-green-800',
      COMPLETED: 'bg-smile-footer-bg border-smile-border/50 text-smile-title',
      CANCELLED: 'bg-red-50 border-red-200 text-red-800',
    };
    return colors[status];
  };

  const utilizationRate =
    schedule.maxAppointments > 0
      ? (schedule.bookedAppointments / schedule.maxAppointments) * 100
      : 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border-2 p-6 transition-all hover:shadow-[0_8px_24px_rgba(65,126,170,0.10)] cursor-pointer',
        getStatusColor(schedule.status),
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold mb-1">
            {schedule.doctorName || 'Doctor'}
          </h3>
          <p className="text-sm opacity-75">
            {schedule.clinicName || 'Clinic'}
          </p>
        </div>
        <span
          className={cn(
            'px-3 py-1 rounded-full text-xs font-semibold',
            getStatusColor(schedule.status),
          )}
        >
          {schedule.status}
        </span>
      </div>

      {/* Date & Time */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Icon icon="mdi:calendar" width={18} className="opacity-60" />
          <span className="font-medium">{schedule.workDate}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Icon icon="mdi:clock-outline" width={18} className="opacity-60" />
          <span>
            {schedule.startTime} - {schedule.endTime}
          </span>
        </div>
        {schedule.shiftName && (
          <div className="flex items-center gap-2 text-sm">
            <Icon icon="mdi:calendar-clock" width={18} className="opacity-60" />
            <span>{schedule.shiftName}</span>
          </div>
        )}
      </div>

      {/* Appointments Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium">Appointments</span>
          <span className="font-bold">
            {schedule.bookedAppointments} / {schedule.maxAppointments}
          </span>
        </div>
        <div className="w-full bg-smile-border/50 rounded-full h-2 overflow-hidden">
          <div
            className={cn(
              'h-full transition-all rounded-full',
              utilizationRate < 50
                ? 'bg-green-500'
                : utilizationRate < 80
                  ? 'bg-yellow-500'
                  : 'bg-red-500',
            )}
            style={{ width: `${utilizationRate}%` }}
          />
        </div>
        <p className="text-xs opacity-60 mt-1">
          {utilizationRate.toFixed(0)}% utilized
        </p>
      </div>

      {/* Notes */}
      {schedule.notes && (
        <div className="mb-4 p-3 bg-white bg-opacity-50 rounded-lg">
          <p className="text-sm flex items-start gap-2">
            <Icon
              icon="mdi:note-text"
              width={18}
              className="mt-0.5 opacity-60"
            />
            <span>{schedule.notes}</span>
          </p>
        </div>
      )}

      {/* Actions */}
      {showActions &&
        schedule.status !== 'COMPLETED' &&
        schedule.status !== 'CANCELLED' && (
          <div className="flex gap-2 pt-4 border-t">
            {schedule.status === 'SCHEDULED' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete?.();
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Icon icon="mdi:check" width={18} />
                  <span>Complete</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel?.();
                  }}
                  className="flex-1 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Icon icon="mdi:close" width={18} />
                  <span>Cancel</span>
                </button>
              </>
            )}
          </div>
        )}
    </div>
  );
};
