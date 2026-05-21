'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

import { useSchedule } from '@/features/schedule/hooks/useSchedule';
import { ScheduleCard } from '@/features/schedule/components/ScheduleCard';
import { ScheduleCalendar } from '@/features/schedule/components/ScheduleCalendar';
import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';
import { ROUTES } from '@/shared/constants/routes';
import type { ScheduleStatus } from '@/features/schedule/types/schedule.type';

export default function DoctorSchedulesPage() {
  const {
    useDoctorSchedules,
    cancelDoctorSchedule,
    completeDoctorSchedule,
    isCancellingSchedule,
    isCompletingSchedule,
  } = useSchedule();

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [filterStatus, setFilterStatus] = useState<ScheduleStatus | 'ALL'>(
    'ALL',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(20);

  const { data, isLoading, error, refetch } = useDoctorSchedules({
    status: filterStatus === 'ALL' ? undefined : filterStatus,
    page,
    size,
  });

  const schedules = data?.data?.content || [];
  const totalPages = data?.data?.totalPages || 0;

  const filteredSchedules = schedules.filter((schedule) => {
    const matchesSearch =
      searchQuery === '' ||
      schedule.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      schedule.clinicName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleCancelSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to cancel this schedule?')) return;

    try {
      await cancelDoctorSchedule(scheduleId);
      refetch();
    } catch (err) {
      alert('Failed to cancel schedule');
    }
  };

  const handleCompleteSchedule = async (scheduleId: string) => {
    try {
      await completeDoctorSchedule(scheduleId);
      refetch();
    } catch (err) {
      alert('Failed to complete schedule');
    }
  };

  if (isLoading) return <Loading fullScreen text="Loading schedules..." />;
  if (error)
    return (
      <ErrorMessage message="Failed to load schedules" onRetry={refetch} />
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Doctor Schedules
            </h1>
            <p className="text-gray-600 mt-1">
              Manage doctor work schedules and shifts
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={ROUTES.DOCTOR_SCHEDULE_NEW}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Icon icon="mdi:plus" width={20} />
              New Schedule
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

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Icon
                  icon="mdi:magnify"
                  width={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search by doctor or clinic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as ScheduleStatus | 'ALL')
              }
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 flex items-center gap-2 transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <Icon icon="mdi:calendar" width={20} />
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 flex items-center gap-2 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                <Icon icon="mdi:view-list" width={20} />
                List
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'calendar' ? (
          <ScheduleCalendar
            schedules={filteredSchedules}
            onScheduleClick={(schedule) => {
              window.location.href = ROUTES.DOCTOR_SCHEDULE_DETAIL(
                schedule.doctorId,
              );
            }}
            loading={isLoading}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {filteredSchedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.doctorScheduleId}
                  schedule={schedule}
                  onClick={() => {
                    window.location.href = ROUTES.DOCTOR_SCHEDULE_DETAIL(
                      schedule.doctorId,
                    );
                  }}
                  onCancel={() =>
                    handleCancelSchedule(schedule.doctorScheduleId)
                  }
                  onComplete={() =>
                    handleCompleteSchedule(schedule.doctorScheduleId)
                  }
                  showActions={true}
                />
              ))}
            </div>

            {filteredSchedules.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Icon
                  icon="mdi:calendar-blank"
                  className="mx-auto mb-3 text-gray-300"
                  width={64}
                />
                <p className="text-xl font-medium">No schedules found</p>
                <p className="text-sm mt-2">
                  Try adjusting your filters or create a new schedule
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
