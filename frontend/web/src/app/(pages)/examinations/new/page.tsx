'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Icon } from '@iconify/react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { DOCTORS, unwrapArr, unwrapOne } from '@/features/schedule/scheduleConstants';
import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { AppShell } from '@/shared/components/layout/AppShell';
import { ENV } from '@/shared/constants/env';
import { toast } from '@/shared/lib/toast';

const BLUE = '#92CDFD';
const cardBase = 'rounded-[20px] border border-white/[0.12] bg-white/[0.03] backdrop-blur-[10px]';
const inputCls =
  'h-11 w-full rounded-xl border border-white/10 bg-[rgba(50,53,56,0.5)] px-4 text-sm text-white outline-none transition placeholder:text-[#6B7280] focus:border-[rgba(146,205,253,0.5)]';
const areaCls =
  'min-h-[100px] w-full rounded-xl border border-white/10 bg-[rgba(50,53,56,0.5)] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-[#6B7280] focus:border-[rgba(146,205,253,0.5)]';

interface Patient { patient_id: string; full_name?: string; patient_code?: string }
interface Clinic { clinic_id: string; clinic_name?: string }
interface Session { session_id: string }
interface Appointment {
  appointment_id: string;
  appointment_code?: string;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  appointment_date?: string;
  appointment_time?: string;
  chief_complaint?: string | null;
  status?: string;
}

const todayLocalDate = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[1px] text-[#8B9199]">{label}</span>
      {children}
    </label>
  );
}

export default function NewExaminationPage() {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.userId);
  const defaultDoctorId = currentUserId ?? DOCTORS[0]?.id;
  const worklistDate = useMemo(() => todayLocalDate(), []);

  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState(defaultDoctorId ?? '');
  const [clinicId, setClinicId] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
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
  const { data: apptRes, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['appointments', 'doctor-worklist', doctorId, worklistDate],
    queryFn: () =>
      apiClient.get(API_ENDPOINTS.APPOINTMENT.DOCTOR_WORKLIST(doctorId), {
        params: { date: worklistDate },
        headers: {
          'x-auth-user-id': doctorId,
          'x-auth-role': 'DOCTOR',
        },
      }),
    enabled: !!doctorId,
  });

  const patients = useMemo(() => unwrapArr<Patient>(patRes), [patRes]);
  const clinics = useMemo(() => unwrapArr<Clinic>(clinicRes), [clinicRes]);
  const checkedInAppointments = useMemo(
    () =>
      unwrapArr<Appointment>(apptRes).filter(
        (appointment) => appointment.status === 'checked_in',
      ),
    [apptRes],
  );
  const selectedAppointment = checkedInAppointments.find(
    (appointment) => appointment.appointment_id === appointmentId,
  );
  const patientLabel = (id: string) => {
    const patient = patients.find((p) => p.patient_id === id);
    return patient?.full_name ?? `Patient ${id.slice(0, 8)}`;
  };
  const clinicLabel = (id: string) => {
    const clinic = clinics.find((c) => c.clinic_id === id);
    return clinic?.clinic_name ?? `Clinic ${id.slice(0, 8)}`;
  };

  const createSession = useMutation({
    mutationFn: () =>
      apiClient.post(`${ENV.SERVICES.GATEWAY}/examination-sessions`, {
        appointment_id: appointmentId,
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
    if (!(doctorId || defaultDoctorId)) { setError('Please select a doctor.'); return; }
    if (!appointmentId) { setError('Please select a checked-in appointment.'); return; }
    setError('');
    createSession.mutate();
  };

  const selectAppointment = (nextAppointmentId: string) => {
    setAppointmentId(nextAppointmentId);
    const appointment = checkedInAppointments.find(
      (item) => item.appointment_id === nextAppointmentId,
    );
    setPatientId(appointment?.patient_id ?? '');
    setClinicId(appointment?.clinic_id ?? '');
    setChiefComplaint(appointment?.chief_complaint ?? '');
  };

  const selectDoctor = (nextDoctorId: string) => {
    setDoctorId(nextDoctorId);
    setAppointmentId('');
    setPatientId('');
    setClinicId('');
    setChiefComplaint('');
  };

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-8 py-10">
        <button onClick={() => router.push('/examinations')} className="flex items-center gap-2 text-sm text-[#C1C7CF] transition hover:text-white">
          <Icon icon="lucide:arrow-left" width={16} /> Back to examinations
        </button>

        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.6px] text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>
            New examination session
          </h1>
          <p className="text-sm text-[#C1C7CF]">Start a clinical examination for a patient.</p>
        </div>

        <form onSubmit={submit} className={`${cardBase} flex flex-col gap-5 p-6`}>
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
              <Icon icon="lucide:alert-circle" width={15} /> {error}
            </div>
          )}

          <Field label="Checked-in appointment">
            <select className={inputCls} value={appointmentId} onChange={(e) => selectAppointment(e.target.value)}>
              <option value="" className="bg-[#16191c]">
                {appointmentsLoading ? 'Loading worklist…' : 'Select a checked-in appointment…'}
              </option>
              {checkedInAppointments.map((appointment) => (
                <option key={appointment.appointment_id} value={appointment.appointment_id} className="bg-[#16191c]">
                  {(appointment.appointment_code ?? appointment.appointment_id.slice(0, 8))}
                  {' · '}
                  {patientLabel(appointment.patient_id)}
                  {appointment.appointment_time ? ` · ${appointment.appointment_time}` : ''}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Clinic">
              <input className={inputCls} value={clinicId ? clinicLabel(clinicId) : '—'} readOnly />
            </Field>
            <Field label="Doctor">
              <select className={inputCls} value={doctorId} onChange={(e) => selectDoctor(e.target.value)}>
                {defaultDoctorId && !DOCTORS.some((d) => d.id === defaultDoctorId) && (
                  <option value={defaultDoctorId} className="bg-[#16191c]">Me ({defaultDoctorId.slice(0, 8)})</option>
                )}
                {DOCTORS.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#16191c]">{d.name}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Patient">
            <input className={inputCls} value={patientId ? patientLabel(patientId) : '—'} readOnly />
          </Field>

          {selectedAppointment && (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-[#C1C7CF]">
              <Icon icon="lucide:calendar-check" width={14} className="mb-0.5 mr-1 inline" />
              {selectedAppointment.appointment_date ?? 'Today'}
              {selectedAppointment.appointment_time ? ` · ${selectedAppointment.appointment_time}` : ''}
              <span className="ml-2 font-semibold capitalize text-[#92CDFD]">
                {selectedAppointment.status?.replace(/_/g, ' ') ?? 'checked in'}
              </span>
            </div>
          )}

          <Field label="Chief complaint / notes">
            <textarea className={areaCls} value={chiefComplaint} placeholder="Reason for visit…" onChange={(e) => setChiefComplaint(e.target.value)} />
          </Field>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.push('/examinations')} className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-[#E1E2E6] transition hover:border-white/25">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSession.isPending}
              className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-[#003450] transition hover:brightness-95 disabled:opacity-60"
              style={{ background: BLUE, boxShadow: '0 0 15px rgba(146,205,253,0.3)' }}
            >
              {createSession.isPending && <Icon icon="line-md:loading-twotone-loop" width={16} />} Create session
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
