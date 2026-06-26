'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Icon } from '@iconify/react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import type { AppointmentRow } from '@/features/appointment/types/appointment.type';
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

  const [appointmentId, setAppointmentId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState(defaultDoctorId ?? '');
  const [clinicId, setClinicId] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [error, setError] = useState('');

  const { data: apptRes, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['examination', 'new', 'appointments'],
    queryFn: () => apiClient.get(`${ENV.SERVICES.GATEWAY}/appointments`, { params: { limit: 100 } }),
  });

  const { data: patRes } = useQuery({
    queryKey: ['patients', 'list'],
    queryFn: () => apiClient.get(`${ENV.SERVICES.GATEWAY}/patients`),
  });
  const { data: clinicRes } = useQuery({
    queryKey: ['clinics', 'list'],
    queryFn: () => apiClient.get(`${ENV.SERVICES.GATEWAY}/clinics`),
  });

  const appointments = useMemo(() => unwrapArr<AppointmentRow>(apptRes), [apptRes]);
  const patients = useMemo(() => unwrapArr<Patient>(patRes), [patRes]);
  const clinics = useMemo(() => unwrapArr<Clinic>(clinicRes), [clinicRes]);
  const selectedAppointment = appointments.find((appointment) => appointment.appointment_id === appointmentId);

  const applyAppointment = (nextAppointmentId: string) => {
    setAppointmentId(nextAppointmentId);
    const appointment = appointments.find((item) => item.appointment_id === nextAppointmentId);
    if (!appointment) return;
    setPatientId(appointment.patient_id ?? '');
    setDoctorId(appointment.doctor_id ?? defaultDoctorId ?? '');
    setClinicId(appointment.clinic_id ?? '');
    setChiefComplaint(appointment.chief_complaint ?? '');
    setError('');
  };

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
    if (!appointmentId) { setError('Please select an appointment first.'); return; }
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

          <Field label="Appointment">
            <select className={inputCls} value={appointmentId} onChange={(e) => applyAppointment(e.target.value)}>
              <option value="" className="[background:var(--surface-input-bg)] text-smile-title">
                {appointmentsLoading ? 'Loading appointments...' : 'Select an appointment...'}
              </option>
              {appointments.map((appointment) => {
                const patient = patients.find((item) => item.patient_id === appointment.patient_id);
                const label = [
                  appointment.appointment_date,
                  appointment.appointment_time?.slice(0, 5),
                  patient?.full_name ?? appointment.patient_id?.slice(0, 8),
                  appointment.appointment_code,
                ].filter(Boolean).join(' · ');
                return (
                  <option key={appointment.appointment_id} value={appointment.appointment_id} className="[background:var(--surface-input-bg)] text-smile-title">
                    {label || appointment.appointment_id.slice(0, 8)}
                  </option>
                );
              })}
            </select>
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Clinic">
              <select className={inputCls} value={clinicId} onChange={(e) => setClinicId(e.target.value)} disabled>
                <option value="" className="[background:var(--surface-input-bg)] text-smile-title">Select a clinic…</option>
                {clinics.map((c) => (
                  <option key={c.clinic_id} value={c.clinic_id} className="[background:var(--surface-input-bg)] text-smile-title">
                    {c.clinic_name ?? c.clinic_id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Doctor">
              <select className={inputCls} value={doctorId} onChange={(e) => setDoctorId(e.target.value)} disabled>
                {defaultDoctorId && !DOCTORS.some((d) => d.id === defaultDoctorId) && (
                  <option value={defaultDoctorId} className="[background:var(--surface-input-bg)] text-smile-title">Me ({defaultDoctorId.slice(0, 8)})</option>
                )}
                {DOCTORS.map((d) => (
                  <option key={d.id} value={d.id} className="[background:var(--surface-input-bg)] text-smile-title">{d.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Patient">
            <select className={inputCls} value={patientId} onChange={(e) => setPatientId(e.target.value)} disabled>
              <option value="" className="[background:var(--surface-input-bg)] text-smile-title">Select an appointment first...</option>
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id} className="[background:var(--surface-input-bg)] text-smile-title">
                  {p.full_name ?? p.patient_id.slice(0, 8)}{p.patient_code ? ` · ${p.patient_code}` : ''}
                </option>
              ))}
            </select>
          </Field>

          {selectedAppointment && (
            <div className="grid gap-3 rounded-2xl border [border-color:var(--surface-panel-border)] [background:var(--surface-panel-bg)] p-4 text-xs text-smile-description sm:grid-cols-3">
              <span><b className="text-smile-title">Date:</b> {selectedAppointment.appointment_date ?? '—'}</span>
              <span><b className="text-smile-title">Time:</b> {selectedAppointment.appointment_time?.slice(0, 5) ?? '—'}</span>
              <span><b className="text-smile-title">Status:</b> {selectedAppointment.status ?? '—'}</span>
            </div>
          )}

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
