'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Icon } from '@iconify/react';

import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ClinicFormDark, type ClinicFormValues } from '@/features/clinic/components/ClinicFormDark';
import { ROUTES } from '@/shared/constants/routes';
import { toast } from '@/shared/lib/toast';

const cardBase = 'rounded-[20px] border [border-color:var(--surface-card-border)] [background:var(--surface-panel-bg)] backdrop-blur-[10px]';

function unwrap<T>(res: unknown): T | null {
  const payload = (res as { data?: unknown })?.data;
  if (payload && typeof payload === 'object' && 'data' in (payload as object)) {
    return (payload as { data: T }).data;
  }
  return (payload as T) ?? null;
}

export default function EditClinicPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['clinic', id],
    queryFn: () => apiClient.get(API_ENDPOINTS.CLINIC.DETAIL(id)),
    enabled: !!id,
  });
  const clinic = useMemo(() => unwrap<Record<string, string>>(data), [data]);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: ClinicFormValues) => apiClient.patch(API_ENDPOINTS.CLINIC.UPDATE(id), values),
    onSuccess: () => {
      toast.success('Clinic updated');
      router.push(ROUTES.CLINIC_DETAIL(id));
    },
    onError: (e) => toast.apiError(e, 'Failed to update clinic'),
  });

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-8 py-10">
        <button onClick={() => router.push(ROUTES.CLINIC_DETAIL(id))} className="flex items-center gap-2 text-sm text-smile-description transition hover:text-smile-title">
          <Icon icon="lucide:arrow-left" width={16} /> Back
        </button>

        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark" style={{ fontFamily: 'Public Sans, sans-serif' }}>
            Edit Clinic
          </h1>
          <p className="text-sm text-smile-description">Update clinic information.</p>
        </div>

        <div className={`${cardBase} p-6`}>
          {isLoading || !clinic ? (
            <div className="flex items-center justify-center gap-2 py-10 text-smile-description">
              <Icon icon="line-md:loading-twotone-loop" width={20} /> Loading…
            </div>
          ) : (
            <ClinicFormDark
              submitLabel="Save changes"
              submitting={isPending}
              initial={{
                clinic_name: clinic.clinic_name,
                clinic_code: clinic.clinic_code,
                address: clinic.address,
                ward: clinic.ward,
                district: clinic.district,
                city: clinic.city,
                phone: clinic.phone,
                email: clinic.email,
                website: clinic.website,
              }}
              onSubmit={(v) => mutateAsync(v)}
              onCancel={() => router.push(ROUTES.CLINIC_DETAIL(id))}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
