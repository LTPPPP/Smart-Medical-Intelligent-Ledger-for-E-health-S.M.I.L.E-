'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { DoctorSchedule, ScheduleStatus } from '../types/schedule.type';
import { cn } from '@/shared/lib/utils';

interface ScheduleCalendarProps {
  schedules: DoctorSchedule[];
  onScheduleClick?: (schedule: DoctorSchedule) => void;
  onDateChange?: (date: string) => void;
  view?: 'day' | 'week' | 'month';
  loading?: boolean;
}

export const ScheduleCalendar = ({
  schedules,
  onScheduleClick,
  onDateChange,
  view = 'week',
  loading = false,
}: ScheduleCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState(view);

  const getStatusColor = (status: ScheduleStatus) => {
    const colors = {
      SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-200',
      ACTIVE: 'bg-green-100 text-green-800 border-green-200',
      COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || colors.SCHEDULED;
  };

  const getStatusIcon = (status: ScheduleStatus) => {
    const icons = {
      SCHEDULED: 'mdi:clock-outline',
      ACTIVE: 'mdi:check-circle',
      COMPLETED: 'mdi:checkbox-marked-circle',
      CANCELLED: 'mdi:close-circle',
    };
    return icons[status] || icons.SCHEDULED;
  };

  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);

    if (onDateChange) {
      onDateChange(newDate.toISOString().split('T')[0]);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);

    if (onDateChange) {
      onDateChange(today.toISOString().split('T')[0]);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Icon
          icon="line-md:loading-twotone-loop"
          width={48}
          className="text-blue-600"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md">
      {/* Calendar Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => changeDate(-7)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon icon="mdi:chevron-left" width={24} />
          </button>
          <div className="text-xl font-bold">{formatDate(currentDate)}</div>
          <button
            onClick={() => changeDate(7)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon icon="mdi:chevron-right" width={24} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Today
          </button>

          <div className="flex border rounded-lg overflow-hidden">
            {(['day', 'week', 'month'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setSelectedView(v)}
                className={cn(
                  'px-4 py-2 capitalize transition-colors',
                  selectedView === v
                    ? 'bg-blue-600 text-white'
                    : 'bg-white hover:bg-gray-50',
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Body */}
      <div className="p-4">
        {schedules.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Icon
              icon="mdi:calendar-blank"
              className="mx-auto mb-3 text-gray-300"
              width={48}
            />
            <p>No schedules found for this date</p>
          </div>
        ) : (
          <div className="space-y-2">
            {schedules.map((schedule) => (
              <div
                key={schedule.doctorScheduleId}
                onClick={() => onScheduleClick?.(schedule)}
                className={cn(
                  'p-4 border-l-4 rounded-lg cursor-pointer transition-all hover:shadow-md',
                  getStatusColor(schedule.status),
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon={getStatusIcon(schedule.status)} width={20} />
                      <span className="font-semibold">
                        {schedule.doctorName || 'Doctor'}
                      </span>
                      <span className="text-sm opacity-75">
                        at {schedule.clinicName || 'Clinic'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:clock-outline" width={16} />
                        <span>
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:account-group" width={16} />
                        <span>
                          {schedule.bookedAppointments} /{' '}
                          {schedule.maxAppointments} patients
                        </span>
                      </div>
                    </div>

                    {schedule.notes && (
                      <div className="mt-2 text-sm opacity-75">
                        <Icon
                          icon="mdi:note-text"
                          width={16}
                          className="inline mr-1"
                        />
                        {schedule.notes}
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
                    <span
                      className={cn(
                        'px-3 py-1 text-xs rounded-full font-medium',
                        getStatusColor(schedule.status),
                      )}
                    >
                      {schedule.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
