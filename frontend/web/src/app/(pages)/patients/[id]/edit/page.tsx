'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';

import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ROUTES } from '@/shared/constants/routes';
import { toast } from '@/shared/lib/toast';
import { PatientFormDark, type PatientFormValues } from '@/features/patient/components/PatientFormDark';

const cardBase = 'rounded-[20px] border backdrop-blur-md';
const cardBaseStyle = { background: 'var(--surface-card-bg)', borderColor: 'var(--surface-card-border)', boxShadow: 'var(--surface-card-shadow)' };

interface Patient extends PatientFormValues {
  patient_id: string;
}

function unwrapOne<T>(res: unknown): T | null {
  const payload = (res as { data?: unknown })?.data;
  if (payload && typeof payload === 'object' && 'data' in (payload as object)) return (payload as { data: T }).data;
  return (payload as T) ?? null;
}

const toInputDate = (d?: string) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export default function EditPatientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => apiClient.get(API_ENDPOINTS.PATIENT.DETAIL(id)),
    enabled: !!id,
  });

  const patient = useMemo(() => unwrapOne<Patient>(data), [data]);

  const updatePatient = useMutation({
    mutationFn: (v: PatientFormValues) => apiClient.patch(API_ENDPOINTS.PATIENT.UPDATE(id), v),
    onSuccess: () => {
      toast.success('Patient updated');
      qc.invalidateQueries({ queryKey: ['patient', id] });
      qc.invalidateQueries({ queryKey: ['patients', 'list'] });
      router.push(ROUTES.PATIENT_DETAIL(id));
    },
    onError: (e) => toast.apiError(e, 'Failed to update patient'),
  });

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-8 py-10">
        <button onClick={() => router.push(ROUTES.PATIENT_DETAIL(id))} className="flex items-center gap-2 text-sm text-smile-description transition hover:text-smile-primary">
          <Icon icon="lucide:arrow-left" width={16} /> Back to profile
        </button>

        <div>
          <h1 className="font-poppins text-[28px] font-bold tracking-[-0.6px] text-smile-title">
            Update Patient Profile
          </h1>
          {patient && <p className="text-sm text-smile-description">{patient.full_name} · {patient.patient_code}</p>}
        </div>

        {isLoading && (
          <div className={`${cardBase} flex items-center justify-center gap-2 py-16 text-smile-description`} style={cardBaseStyle}>
            <Icon icon="line-md:loading-twotone-loop" width={20} /> Loading…
          </div>
        )}
        {!isLoading && !patient && (
          <div className={`${cardBase} p-10 text-center text-sm text-smile-description`} style={cardBaseStyle}>Patient not found.</div>
        )}

        {patient && (
          <div className={`${cardBase} p-6`} style={cardBaseStyle}>
            <PatientFormDark
              submitLabel="Save changes"
              submitting={updatePatient.isPending}
              initial={{
                patient_code: patient.patient_code,
                full_name: patient.full_name,
                date_of_birth: toInputDate(patient.date_of_birth),
                gender: patient.gender ?? '',
                phone: patient.phone ?? '',
                email: patient.email ?? '',
                address: patient.address ?? '',
                blood_type: patient.blood_type ?? '',
                allergies: patient.allergies ?? '',
                chronic_diseases: patient.chronic_diseases ?? '',
              }}
              onSubmit={(v) => updatePatient.mutate(v)}
              onCancel={() => router.push(ROUTES.PATIENT_DETAIL(id))}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
