'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Icon } from '@iconify/react';

import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ROUTES } from '@/shared/constants/routes';
import { toast } from '@/shared/lib/toast';
import { PatientFormDark, type PatientFormValues } from '@/features/patient/components/PatientFormDark';

const cardBase = 'rounded-[20px] border backdrop-blur-md';
const cardBaseStyle = { background: 'var(--surface-card-bg)', borderColor: 'var(--surface-card-border)', boxShadow: 'var(--surface-card-shadow)' };

export default function NewPatientPage() {
  const router = useRouter();

  const createPatient = useMutation({
    mutationFn: (v: PatientFormValues) => apiClient.post(API_ENDPOINTS.PATIENT.CREATE, v),
    onSuccess: () => {
      toast.success('Patient created');
      router.push(ROUTES.PATIENTS);
    },
    onError: (e) => toast.apiError(e, 'Failed to create patient'),
  });

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-8 py-10">
        <button onClick={() => router.push(ROUTES.PATIENTS)} className="flex items-center gap-2 text-sm text-smile-description transition hover:text-smile-primary">
          <Icon icon="lucide:arrow-left" width={16} /> Back to patients
        </button>

        <div>
          <h1 className="font-poppins text-[28px] font-bold tracking-[-0.6px] text-smile-title">
            Add Patient Profile
          </h1>
          <p className="text-sm text-smile-description">Create a new patient record.</p>
        </div>

        <div className={`${cardBase} p-6`} style={cardBaseStyle}>
          <PatientFormDark
            submitLabel="Create patient"
            submitting={createPatient.isPending}
            onSubmit={(v) => createPatient.mutate(v)}
            onCancel={() => router.push(ROUTES.PATIENTS)}
          />
        </div>
      </div>
    </AppShell>
  );
}
