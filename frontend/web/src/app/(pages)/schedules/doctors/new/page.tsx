'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Icon } from '@iconify/react';

import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ScheduleForm, type ScheduleFormValues } from '@/features/schedule/components/ScheduleForm';
import { ROUTES } from '@/shared/constants/routes';
import { toast } from '@/shared/lib/toast';

const cardBase =
  'rounded-[20px] border backdrop-blur-md [background:var(--surface-card-bg)] [border-color:var(--surface-card-border)] [box-shadow:var(--surface-card-shadow)]';

export default function NewWorkSchedulePage() {
  const router = useRouter();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (v: ScheduleFormValues) => apiClient.post(API_ENDPOINTS.SCHEDULE.CREATE, v),
    onSuccess: () => { toast.success('Work schedule created — doctor notified'); router.push(ROUTES.DOCTOR_SCHEDULES); },
    onError: (e) => toast.apiError(e, 'Failed to create schedule'),
  });

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-8 py-10">
        <button onClick={() => router.push(ROUTES.DOCTOR_SCHEDULES)} className="flex items-center gap-2 text-sm text-smile-description transition hover:text-smile-primary">
          <Icon icon="lucide:arrow-left" width={16} /> Back to schedules
        </button>
        <div className="flex flex-col gap-1">
          <h1 className="font-poppins text-[28px] font-bold tracking-[-0.6px] text-smile-title">Create Work / On-Call Schedule</h1>
          <p className="text-sm text-smile-description">Assign a doctor to a clinic shift on a given date.</p>
        </div>
        <div className={`${cardBase} p-6`}>
          <ScheduleForm mode="create" submitLabel="Create schedule" submitting={isPending} onSubmit={(v) => mutateAsync(v)} onCancel={() => router.push(ROUTES.DOCTOR_SCHEDULES)} />
        </div>
      </div>
    </AppShell>
  );
}
