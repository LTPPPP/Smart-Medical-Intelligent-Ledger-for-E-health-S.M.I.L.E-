'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Icon } from '@iconify/react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/authStore';
import { DOCTORS, unwrapArr } from '@/features/schedule/scheduleConstants';
import { apiClient } from '@/shared/api/client';
import { API_ENDPOINTS } from '@/shared/api/endpoint';
import { ENV } from '@/shared/constants/env';
import { ROUTES } from '@/shared/constants/routes';
import { toast } from '@/shared/lib/toast';

const TEAL = '#2f9e8a';
const BLUE = '#417eaa';
const cardBase = 'rounded-[20px] border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] backdrop-blur-xl';
const inputCls =
  'h-11 w-full rounded-xl border [border-color:var(--surface-panel-border)] [background:var(--surface-input-bg)] px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]';

type Variant = 'facility' | 'specialty' | 'doctor' | 'outside';

const TABS: { id: Variant; label: string; icon: string }[] = [
  { id: 'facility', label: 'At Facility', icon: 'lucide:building-2' },
  { id: 'specialty', label: 'By Specialty', icon: 'lucide:stethoscope' },
  { id: 'doctor', label: 'By Doctor', icon: 'lucide:user-round' },
  { id: 'outside', label: 'Outside Hours', icon: 'lucide:moon' },
];

interface Patient {
  patient_id: string;
  full_name: string;
  patient_code: string;
}
interface Clinic {
  clinic_id: string;
  clinic_name: string;
}
interface Specialty {
  specialty_id: string;
  specialty_name: string;
}
interface Service {
  service_id: string;
  service_name: string;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">
        {label}
        {required && <span className="ml-1 text-smile-primary">*</span>}
      </span>
      {children}
    </label>
  );
}

interface FormState {
  patient_id: string;
  clinic_id: string;
  doctor_id: string;
  specialty_id: string;
  service_id: string;
  date: string;
  time: string;
  chief_complaint: string;
  notes: string;
}

const EMPTY: FormState = {
  patient_id: '',
  clinic_id: '',
  doctor_id: '',
  specialty_id: '',
  service_id: '',
  date: '',
  time: '',
  chief_complaint: '',
  notes: '',
};

export function BookingTabsDark() {
  const router = useRouter();
  const { user } = useAuthStore();
  // Cross-service actor id; falls back to the first seeded doctor for the demo.
  const actorId = user?.userId || DOCTORS[0].id;
  const [tab, setTab] = useState<Variant>('facility');
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState('');

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const { data: patientsRes } = useQuery({
    queryKey: ['patients', 'list'],
    queryFn: () => apiClient.get(`${ENV.SERVICES.GATEWAY}/patients`),
  });
  const { data: clinicsRes } = useQuery({
    queryKey: ['clinics', 'list'],
    queryFn: () => apiClient.get(API_ENDPOINTS.CLINIC.LIST),
  });
  const { data: specsRes } = useQuery({
    queryKey: ['specialties', 'list'],
    queryFn: () => apiClient.get(API_ENDPOINTS.SPECIALTY.LIST),
  });
  const { data: servicesRes } = useQuery({
    queryKey: ['services', 'list'],
    queryFn: () => apiClient.get(API_ENDPOINTS.SERVICE.LIST),
  });

  const patients = useMemo(() => unwrapArr<Patient>(patientsRes), [patientsRes]);
  const clinics = useMemo(() => unwrapArr<Clinic>(clinicsRes), [clinicsRes]);
  const specialties = useMemo(() => unwrapArr<Specialty>(specsRes), [specsRes]);
  const services = useMemo(() => unwrapArr<Service>(servicesRes), [servicesRes]);

  const createMut = useMutation({
    mutationFn: ({ url, body }: { url: string; body: Record<string, unknown> }) => apiClient.post(url, body),
    onSuccess: () => {
      toast.success('Appointment booked');
      router.push(ROUTES.APPOINTMENTS);
    },
    onError: (e) => toast.apiError(e, 'Failed to book appointment'),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    // Shared validation
    if (!form.patient_id) return setError('Please select a patient.');
    if (!form.clinic_id) return setError('Please select a clinic.');

    let url = '';
    let body: Record<string, unknown> = {};

    if (tab === 'facility') {
      if (!form.doctor_id) return setError('Please select a doctor.');
      if (!form.date) return setError('Please pick a date.');
      if (!form.time) return setError('Please pick a time.');
      url = API_ENDPOINTS.APPOINTMENT.CREATE_BY_CLINIC;
      body = {
        patient_id: form.patient_id,
        doctor_id: form.doctor_id,
        clinic_id: form.clinic_id,
        appointment_date: form.date,
        appointment_time: form.time,
        appointment_type: 'consultation',
        created_by: actorId,
        ...(form.service_id ? { service_id: form.service_id } : {}),
        ...(form.chief_complaint ? { chief_complaint: form.chief_complaint } : {}),
        ...(form.notes ? { notes: form.notes } : {}),
      };
    } else if (tab === 'specialty') {
      if (!form.specialty_id) return setError('Please select a specialty.');
      url = API_ENDPOINTS.APPOINTMENT.CREATE_BY_SPECIALTY;
      body = {
        specialty_id: form.specialty_id,
        patient_id: form.patient_id,
        clinic_id: form.clinic_id,
        created_by: actorId,
        ...(form.date ? { preferred_date: form.date } : {}),
        ...(form.time ? { preferred_time: form.time } : {}),
        ...(form.chief_complaint ? { chief_complaint: form.chief_complaint } : {}),
      };
    } else if (tab === 'doctor' || tab === 'outside') {
      if (!form.doctor_id) return setError('Please select a doctor.');
      if (!form.date) return setError('Please pick a date.');
      if (!form.time) return setError('Please pick a time.');
      url =
        tab === 'doctor'
          ? API_ENDPOINTS.APPOINTMENT.CREATE_BY_DOCTOR
          : API_ENDPOINTS.APPOINTMENT.CREATE_OUTSIDE_HOURS;
      body = {
        doctor_id: form.doctor_id,
        patient_id: form.patient_id,
        clinic_id: form.clinic_id,
        appointment_date: form.date,
        appointment_time: form.time,
        created_by: actorId,
        ...(tab === 'outside'
          ? { outside_hours_reason: form.chief_complaint || 'After-hours request' }
          : {}),
        ...(form.service_id ? { service_id: form.service_id } : {}),
        ...(form.chief_complaint ? { chief_complaint: form.chief_complaint } : {}),
        ...(form.notes ? { notes: form.notes } : {}),
      };
    }

    setError('');
    createMut.mutate({ url, body });
  };

  const patientSelect = (
    <Field label="Patient" required>
      <select className={inputCls} value={form.patient_id} onChange={(e) => set('patient_id', e.target.value)}>
        <option value="" className="[background:var(--surface-input-bg)] text-smile-title">Select patient…</option>
        {patients.map((p) => (
          <option key={p.patient_id} value={p.patient_id} className="[background:var(--surface-input-bg)] text-smile-title">
            {p.full_name} ({p.patient_code})
          </option>
        ))}
      </select>
    </Field>
  );

  const clinicSelect = (
    <Field label="Clinic" required>
      <select className={inputCls} value={form.clinic_id} onChange={(e) => set('clinic_id', e.target.value)}>
        <option value="" className="[background:var(--surface-input-bg)] text-smile-title">Select clinic…</option>
        {clinics.map((c) => (
          <option key={c.clinic_id} value={c.clinic_id} className="[background:var(--surface-input-bg)] text-smile-title">
            {c.clinic_name}
          </option>
        ))}
      </select>
    </Field>
  );

  const doctorSelect = (
    <Field label="Doctor" required>
      <select className={inputCls} value={form.doctor_id} onChange={(e) => set('doctor_id', e.target.value)}>
        <option value="" className="[background:var(--surface-input-bg)] text-smile-title">Select doctor…</option>
        {DOCTORS.map((d) => (
          <option key={d.id} value={d.id} className="[background:var(--surface-input-bg)] text-smile-title">
            {d.name}
          </option>
        ))}
      </select>
    </Field>
  );

  const specialtySelect = (
    <Field label="Specialty" required>
      <select className={inputCls} value={form.specialty_id} onChange={(e) => set('specialty_id', e.target.value)}>
        <option value="" className="[background:var(--surface-input-bg)] text-smile-title">Select specialty…</option>
        {specialties.map((s) => (
          <option key={s.specialty_id} value={s.specialty_id} className="[background:var(--surface-input-bg)] text-smile-title">
            {s.specialty_name}
          </option>
        ))}
      </select>
    </Field>
  );

  const serviceSelect = (
    <Field label="Service (optional)">
      <select className={inputCls} value={form.service_id} onChange={(e) => set('service_id', e.target.value)}>
        <option value="" className="[background:var(--surface-input-bg)] text-smile-title">No specific service</option>
        {services.map((s) => (
          <option key={s.service_id} value={s.service_id} className="[background:var(--surface-input-bg)] text-smile-title">
            {s.service_name}
          </option>
        ))}
      </select>
    </Field>
  );

  const dateField = (label = 'Date', required = false) => (
    <Field label={label} required={required}>
      <input type="date" className={inputCls} value={form.date} onChange={(e) => set('date', e.target.value)} />
    </Field>
  );
  const timeField = (label = 'Time', required = false) => (
    <Field label={label} required={required}>
      <input type="time" className={inputCls} value={form.time} onChange={(e) => set('time', e.target.value)} />
    </Field>
  );
  const chiefField = (
    <Field label="Chief complaint">
      <input
        className={inputCls}
        value={form.chief_complaint}
        placeholder="Reason for visit"
        onChange={(e) => set('chief_complaint', e.target.value)}
      />
    </Field>
  );
  const notesField = (
    <Field label="Notes">
      <input className={inputCls} value={form.notes} placeholder="Additional notes" onChange={(e) => set('notes', e.target.value)} />
    </Field>
  );

  return (
    <div className={`${cardBase} flex flex-col gap-6 p-6`}>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setError('');
              }}
              className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition"
              style={
                active
                  ? { background: 'rgba(69,240,207,0.2)', borderColor: TEAL, color: TEAL }
                  : { background: '#1D2023', borderColor: 'rgba(255,255,255,0.1)', color: '#C1C7CF' }
              }
            >
              <Icon icon={t.icon} width={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'outside' && (
        <div className="flex items-start gap-2 rounded-xl border border-[rgba(146,205,253,0.3)] bg-[rgba(146,205,253,0.08)] px-4 py-3 text-sm text-smile-primary">
          <Icon icon="lucide:info" width={16} className="mt-0.5 shrink-0" style={{ color: BLUE }} />
          <span>
            After hours: this slot falls outside the clinic&apos;s normal business hours. The appointment may require
            special staffing approval and confirmation.
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
          <Icon icon="lucide:alert-circle" width={15} /> {error}
        </div>
      )}

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {patientSelect}
          {clinicSelect}

          {tab === 'specialty' ? specialtySelect : doctorSelect}
          {tab !== 'specialty' && serviceSelect}

          {tab === 'specialty' ? (
            <>
              {dateField('Preferred date')}
              {timeField('Preferred time')}
            </>
          ) : (
            <>
              {dateField('Date', true)}
              {timeField('Time', true)}
            </>
          )}

          {chiefField}
          {tab !== 'specialty' && notesField}
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="submit"
            disabled={createMut.isPending}
            className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-smile-primary-dark disabled:opacity-60 bg-smile-primary"
          >
            {createMut.isPending && <Icon icon="line-md:loading-twotone-loop" width={16} />} Book Appointment
          </button>
        </div>
      </form>
    </div>
  );
}

export default BookingTabsDark;
