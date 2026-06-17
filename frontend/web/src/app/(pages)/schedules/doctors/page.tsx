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

const STATUS_OPTIONS: { value: ScheduleStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'SCHEDULED', label: 'Lịch trình' },
  { value: 'ACTIVE', label: 'Đang làm' },
  { value: 'COMPLETED', label: 'Hoàn tất' },
  { value: 'CANCELLED', label: 'Huỷ' },
];

export default function DoctorSchedulesPage() {
  const {
    useDoctorSchedules,
    cancelDoctorSchedule,
    completeDoctorSchedule,
  } = useSchedule();

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [filterStatus, setFilterStatus] = useState<ScheduleStatus | 'ALL'>('ALL');
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
    if (searchQuery === '') return true;
    const q = searchQuery.toLowerCase();
    return (
      schedule.doctorName?.toLowerCase().includes(q) ||
      schedule.clinicName?.toLowerCase().includes(q)
    );
  });

  const handleCancelSchedule = async (scheduleId: string) => {
    if (!confirm('Bạn có chắc muốn huỷ lịch này?')) return;
    try {
      await cancelDoctorSchedule(scheduleId);
      refetch();
    } catch {
      alert('Không thể huỷ lịch');
    }
  };

  const handleCompleteSchedule = async (scheduleId: string) => {
    try {
      await completeDoctorSchedule(scheduleId);
      refetch();
    } catch {
      alert('Không thể hoàn tất lịch');
    }
  };

  if (isLoading) return <Loading fullScreen text="Đang tải lịch làm việc..." />;
  if (error) return <ErrorMessage message="Không thể tải lịch làm việc" onRetry={refetch} />;

  return (
    <div className="min-h-screen bg-[#E7ECEF]">
      {/* Teal gradient header */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-700 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-lg">
                <Icon icon="mdi:calendar-clock" width={30} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Lịch làm việc bác sĩ</h1>
                <p className="text-teal-100 text-sm mt-0.5">Quản lý ca trực và lịch khám</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-all text-sm"
              >
                <Icon icon="mdi:refresh" width={18} />
                Làm mới
              </button>
              <Link
                href={ROUTES.DOCTOR_SCHEDULE_NEW}
                className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-white text-teal-700 font-semibold rounded-xl shadow-md hover:brightness-95 hover:-translate-y-px transition-all text-sm"
              >
                <Icon icon="mdi:plus" width={18} />
                Tạo lịch
              </Link>
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Icon
                icon="mdi:magnify"
                width={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60"
              />
              <input
                type="text"
                placeholder="Tìm bác sĩ hoặc phòng khám..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 min-h-[44px] bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 text-sm focus:outline-none focus:border-white/60 focus:bg-white/25 transition-all"
              />
            </div>

            {/* Status segmented */}
            <div className="inline-flex p-1 gap-0.5 bg-white/15 border border-white/20 rounded-full">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterStatus(opt.value)}
                  className={
                    filterStatus === opt.value
                      ? 'px-3 min-h-[36px] rounded-full text-xs font-semibold bg-white text-teal-700 shadow-sm transition-all'
                      : 'px-3 min-h-[36px] rounded-full text-xs font-semibold text-white/80 hover:text-white transition-colors'
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Calendar / List toggle */}
            <div className="inline-flex p-1 gap-0.5 bg-white/15 border border-white/20 rounded-full">
              {[
                { id: 'calendar' as const, icon: 'mdi:calendar', label: 'Lịch' },
                { id: 'list' as const, icon: 'mdi:view-list', label: 'Danh sách' },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setViewMode(v.id)}
                  className={
                    viewMode === v.id
                      ? 'inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-full text-xs font-semibold bg-white text-teal-700 shadow-sm transition-all'
                      : 'inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-full text-xs font-semibold text-white/80 hover:text-white transition-colors'
                  }
                >
                  <Icon icon={v.icon} width={14} />
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {viewMode === 'calendar' ? (
          <ScheduleCalendar
            schedules={filteredSchedules}
            onScheduleClick={(schedule) => {
              window.location.href = ROUTES.DOCTOR_SCHEDULE_DETAIL(schedule.doctorId);
            }}
            loading={isLoading}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
              {filteredSchedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.doctorScheduleId}
                  schedule={schedule}
                  onClick={() => {
                    window.location.href = ROUTES.DOCTOR_SCHEDULE_DETAIL(schedule.doctorId);
                  }}
                  onCancel={() => handleCancelSchedule(schedule.doctorScheduleId)}
                  onComplete={() => handleCompleteSchedule(schedule.doctorScheduleId)}
                  showActions={true}
                />
              ))}
            </div>

            {filteredSchedules.length === 0 && (
              <div className="flex flex-col items-center py-16 bg-white rounded-2xl shadow-[6px_6px_14px_rgba(177,192,202,0.7),-6px_-6px_14px_rgba(255,255,255,1)] text-slate-400">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
                  <Icon icon="mdi:calendar-blank" width={36} className="text-teal-300" />
                </div>
                <p className="text-lg font-semibold text-slate-600">Không có lịch nào</p>
                <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc tạo lịch mới</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] bg-white rounded-xl shadow-[4px_4px_10px_rgba(177,192,202,0.6),-4px_-4px_10px_rgba(255,255,255,1)] text-sm font-semibold text-slate-700 disabled:opacity-40 hover:-translate-y-px transition-all"
                >
                  <Icon icon="mdi:chevron-left" width={18} />
                  Trước
                </button>
                <span className="px-4 py-2 text-sm text-slate-500">
                  Trang {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] bg-white rounded-xl shadow-[4px_4px_10px_rgba(177,192,202,0.6),-4px_-4px_10px_rgba(255,255,255,1)] text-sm font-semibold text-slate-700 disabled:opacity-40 hover:-translate-y-px transition-all"
                >
                  Sau
                  <Icon icon="mdi:chevron-right" width={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
