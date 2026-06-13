'use client';

import { useState } from 'react';

import { Icon } from '@iconify/react';

import { ScheduleCalendar } from '@/features/schedule/components/ScheduleCalendar';
import { ScheduleCard } from '@/features/schedule/components/ScheduleCard';
import { useSchedule } from '@/features/schedule/hooks/useSchedule';
import type { ScheduleStatus } from '@/features/schedule/types/schedule.type';
import { Loading } from '@/shared/components/common/Loading';
import { OperationsLayout, MetricCard } from '@/shared/components/layout/OperationsLayout';
import { ROUTES } from '@/shared/constants/routes';
import { demoSchedules } from '@/shared/data/clinicalDemoData';
import { toPage } from '@/shared/lib/apiShape';

export default function DoctorSchedulesPage() {
  const {
    useDoctorSchedules,
    cancelDoctorSchedule,
    completeDoctorSchedule,
  } = useSchedule();

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [filterStatus, setFilterStatus] = useState<ScheduleStatus | 'ALL'>(
    'ALL',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(20);

  const { data, isLoading, refetch } = useDoctorSchedules({
    status: filterStatus === 'ALL' ? undefined : filterStatus,
    page,
    size,
  });

  const pageData = toPage(data?.data, demoSchedules, page, size);
  const schedules = pageData.content;
  const totalPages = pageData.totalPages;

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
    } catch {
      alert('Failed to cancel schedule');
    }
  };

  const handleCompleteSchedule = async (scheduleId: string) => {
    try {
      await completeDoctorSchedule(scheduleId);
      refetch();
    } catch {
      alert('Failed to complete schedule');
    }
  };

  return (
    <OperationsLayout
      title="Doctor schedules"
      description="Review provider availability by list or calendar, then open the doctor schedule detail for shift-level planning."
      icon="lucide:calendar-range"
      actions={[
        { label: 'New schedule', href: ROUTES.DOCTOR_SCHEDULE_NEW, icon: 'lucide:plus', variant: 'primary' },
        { label: 'Leaves', href: ROUTES.DOCTOR_LEAVES, icon: 'lucide:calendar-off' },
        { label: 'Refresh', icon: 'lucide:refresh-cw', onClick: () => refetch() },
      ]}
    >
      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="Schedules" value={filteredSchedules.length} detail="Current filter" tone="brand" />
        <MetricCard label="Active" value={schedules.filter((item) => item.status === 'ACTIVE').length} detail="Currently working" tone="green" />
        <MetricCard label="Booked" value={schedules.reduce((sum, item) => sum + item.bookedAppointments, 0)} detail="Appointments reserved" tone="blue" />
        <MetricCard label="Capacity" value={schedules.reduce((sum, item) => sum + item.maxAppointments, 0)} detail="Total slots" />
      </div>

        {/* Controls */}
        <div className="mt-5 border border-smile-border/50 bg-white p-4">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Icon
                  icon="mdi:magnify"
                  width={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-smile-description"
                />
                <input
                  type="text"
                  placeholder="Search by doctor or clinic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-smile-border py-2 pl-10 pr-4 text-sm focus:border-smile-primary focus:ring-2 focus:ring-smile-primary/20"
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as ScheduleStatus | 'ALL')
              }
              className="rounded-md border border-smile-border px-4 py-2 text-sm focus:ring-2 focus:ring-smile-primary/20"
            >
              <option value="ALL">All Status</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex overflow-hidden rounded-md border border-smile-border/50">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 flex items-center gap-2 transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-smile-primary text-white'
                    : 'bg-white hover:bg-smile-footer-bg'
                }`}
              >
                <Icon icon="mdi:calendar" width={20} />
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 flex items-center gap-2 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-smile-primary text-white'
                    : 'bg-white hover:bg-smile-footer-bg'
                }`}
              >
                <Icon icon="mdi:view-list" width={20} />
                List
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading && <Loading text="Loading schedules..." />}
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
              <div className="text-center py-12 text-smile-description">
                <Icon
                  icon="mdi:calendar-blank"
                  className="mx-auto mb-3 text-smile-description/50"
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
                  className="px-4 py-2 border rounded-lg hover:bg-smile-footer-bg disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="px-4 py-2 border rounded-lg hover:bg-smile-footer-bg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
    </OperationsLayout>
  );
}
