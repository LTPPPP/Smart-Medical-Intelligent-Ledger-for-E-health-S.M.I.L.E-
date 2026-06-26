'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Icon } from '@iconify/react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { DOCTORS, unwrapArr, unwrapOne } from '@/features/schedule/scheduleConstants';
import { apiClient } from '@/shared/api/client';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ENV } from '@/shared/constants/env';
import { toast } from '@/shared/lib/toast';

const cardBase = 'rounded-[20px] border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] backdrop-blur-xl';
const inputCls =
  'h-11 w-full rounded-xl border [border-color:var(--surface-panel-border)] [background:var(--surface-input-bg)] px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]';
const areaCls =
  'min-h-[100px] w-full rounded-xl border [border-color:var(--surface-panel-border)] [background:var(--surface-input-bg)] px-4 py-2.5 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]';

interface Patient { patient_id: string; full_name?: string; patient_code?: string }
interface Clinic { clinic_id: string; clinic_name?: string }
interface Session { session_id: string }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">{label}</span>
      {children}
    </label>
  );
}

export default function NewExaminationPage() {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.userId);
  const defaultDoctorId = currentUserId ?? DOCTORS[0]?.id;

  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState(defaultDoctorId ?? '');
  const [clinicId, setClinicId] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [error, setError] = useState('');

  const { data: patRes } = useQuery({
    queryKey: ['patients', 'list'],
    queryFn: () => apiClient.get(`${ENV.SERVICES.GATEWAY}/patients`),
  });
  const { data: clinicRes } = useQuery({
    queryKey: ['clinics', 'list'],
    queryFn: () => apiClient.get(`${ENV.SERVICES.GATEWAY}/clinics`),
  });

  const patients = useMemo(() => unwrapArr<Patient>(patRes), [patRes]);
  const clinics = useMemo(() => unwrapArr<Clinic>(clinicRes), [clinicRes]);

  const createSession = useMutation({
    mutationFn: () =>
      apiClient.post(`${ENV.SERVICES.GATEWAY}/examination-sessions`, {
        patient_id: patientId,
        doctor_id: doctorId || defaultDoctorId,
        clinic_id: clinicId,
        chief_complaint: chiefComplaint.trim() || undefined,
        status: 'in_progress',
      }),
    onSuccess: (res) => {
      toast.success('Examination session created');
      const created = unwrapOne<Session>(res);
      if (created?.session_id) router.push(`/examinations/${created.session_id}`);
      else router.push('/examinations');
    },
    onError: (e) => toast.apiError(e, 'Failed to create session'),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) { setError('Please select a patient.'); return; }
    if (!clinicId) { setError('Please select a clinic.'); return; }
    if (!(doctorId || defaultDoctorId)) { setError('Please select a doctor.'); return; }
    setError('');
    createSession.mutate();
  };

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-8 py-10">
        <button onClick={() => router.push('/examinations')} className="flex items-center gap-2 text-sm text-smile-description transition hover:text-smile-primary">
          <Icon icon="lucide:arrow-left" width={16} /> Back to examinations
        </button>

        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.6px] text-smile-primary-dark" style={{ fontFamily: 'Public Sans, sans-serif' }}>
            New examination session
          </h1>
          <p className="text-sm text-smile-description">Start a clinical examination for a patient.</p>
        </div>

        <form onSubmit={submit} className={`${cardBase} flex flex-col gap-5 p-6`}>
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
              <Icon icon="lucide:alert-circle" width={15} /> {error}
            </div>
          )}

          <Field label="Patient">
            <select className={inputCls} value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              <option value="" className="[background:var(--surface-input-bg)] text-smile-title">Select a patient…</option>
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id} className="[background:var(--surface-input-bg)] text-smile-title">
                  {p.full_name ?? p.patient_id.slice(0, 8)}{p.patient_code ? ` · ${p.patient_code}` : ''}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Clinic">
              <select className={inputCls} value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
                <option value="" className="[background:var(--surface-input-bg)] text-smile-title">Select a clinic…</option>
                {clinics.map((c) => (
                  <option key={c.clinic_id} value={c.clinic_id} className="[background:var(--surface-input-bg)] text-smile-title">
                    {c.clinic_name ?? c.clinic_id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Doctor">
              <select className={inputCls} value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                {defaultDoctorId && !DOCTORS.some((d) => d.id === defaultDoctorId) && (
                  <option value={defaultDoctorId} className="[background:var(--surface-input-bg)] text-smile-title">Me ({defaultDoctorId.slice(0, 8)})</option>
                )}
                {DOCTORS.map((d) => (
                  <option key={d.id} value={d.id} className="[background:var(--surface-input-bg)] text-smile-title">{d.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Chief complaint / notes">
            <textarea className={areaCls} value={chiefComplaint} placeholder="Reason for visit…" onChange={(e) => setChiefComplaint(e.target.value)} />
          </Field>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.push('/examinations')} className="rounded-full border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-5 py-2.5 text-sm font-semibold text-smile-title transition hover:[border-color:var(--surface-card-border)]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSession.isPending}
              className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-smile-primary-dark disabled:opacity-60 bg-smile-primary"
            >
              {createSession.isPending && <Icon icon="line-md:loading-twotone-loop" width={16} />} Create session
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
