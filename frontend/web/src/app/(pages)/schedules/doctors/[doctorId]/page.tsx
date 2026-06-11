'use client';

import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useSchedule } from '@/features/schedule/hooks/useSchedule';
import { ScheduleCalendar } from '@/features/schedule/components/ScheduleCalendar';
import { Loading } from '@/shared/components/common/Loading';
import { ErrorMessage } from '@/shared/components/ui/ErrorMessage';

export default function DoctorScheduleDetailPage() {
  const router = useRouter();
  const doctorId = useParams().doctorId as string;
  const { useSchedulesByDoctor } = useSchedule();
  const { data, isLoading, error, refetch } = useSchedulesByDoctor(doctorId);

  if (isLoading) return <Loading fullScreen text="Loading doctor schedule..." />;
  if (error) return <ErrorMessage message="Unable to load doctor schedule" onRetry={refetch} />;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <button type="button" onClick={() => router.back()} className="mb-5 flex items-center gap-2 text-sm font-medium text-gray-600">
          <Icon icon="lucide:arrow-left" width={17} />
          Back to schedules
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Doctor schedule</h1>
        <p className="mb-6 mt-1 font-mono text-sm text-gray-500">{doctorId}</p>
        {(data?.data ?? []).length === 0 ? (
          <div className="border-y border-dashed border-gray-300 py-16 text-center text-gray-500">
            No schedules found for this doctor.
          </div>
        ) : (
          <ScheduleCalendar schedules={data?.data ?? []} />
        )}
      </div>
    </main>
  );
}
