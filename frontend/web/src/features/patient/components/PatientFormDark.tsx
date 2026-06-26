'use client';

import { useState } from 'react';

import { Icon } from '@iconify/react';


export interface PatientFormValues {
  patient_code: string;
  full_name: string;
  date_of_birth?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  blood_type?: string;
  allergies?: string;
  chronic_diseases?: string;
}

const EMPTY: PatientFormValues = {
  patient_code: '',
  full_name: '',
  date_of_birth: '',
  gender: '',
  phone: '',
  email: '',
  address: '',
  blood_type: '',
  allergies: '',
  chronic_diseases: '',
};

const GENDER_OPTIONS = ['', 'MALE', 'FEMALE', 'OTHER'];
const BLOOD_OPTIONS = ['', 'A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const inputCls =
  'h-11 rounded-xl border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]';

function Label({ label, required, children, colSpan }: { label: string; required?: boolean; children: React.ReactNode; colSpan?: boolean }) {
  return (
    <label className={`flex flex-col gap-1.5 ${colSpan ? 'sm:col-span-2' : ''}`}>
      <span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">
        {label}{required && <span className="text-smile-primary"> *</span>}
      </span>
      {children}
    </label>
  );
}

export function PatientFormDark({
  initial, submitting, submitLabel, onSubmit, onCancel,
}: {
  initial?: Partial<PatientFormValues>;
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: PatientFormValues) => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<PatientFormValues>({ ...EMPTY, ...initial });
  const [error, setError] = useState('');
  const set = (k: keyof PatientFormValues) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_code.trim() || !form.full_name.trim()) {
      setError('Patient code and full name are required.');
      return;
    }
    setError('');
    // Strip empty optional strings so the BE receives undefined instead of ''.
    const cleaned: PatientFormValues = { ...form };
    (Object.keys(cleaned) as (keyof PatientFormValues)[]).forEach((k) => {
      if (k !== 'patient_code' && k !== 'full_name' && cleaned[k] === '') delete cleaned[k];
    });
    onSubmit(cleaned);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          <Icon icon="lucide:alert-circle" width={16} /> {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Label label="Patient code" required>
          <input className={inputCls} value={form.patient_code} placeholder="PAT-001" onChange={(e) => set('patient_code')(e.target.value)} />
        </Label>
        <Label label="Full name" required>
          <input className={inputCls} value={form.full_name} placeholder="Nguyễn Văn A" onChange={(e) => set('full_name')(e.target.value)} />
        </Label>
        <Label label="Date of birth">
          <input type="date" className={inputCls} value={form.date_of_birth ?? ''} onChange={(e) => set('date_of_birth')(e.target.value)} />
        </Label>
        <Label label="Gender">
          <select className={inputCls} value={form.gender ?? ''} onChange={(e) => set('gender')(e.target.value)}>
            {GENDER_OPTIONS.map((g) => <option key={g || 'none'} value={g} className="[background:var(--surface-input-bg)] text-smile-title">{g || '— select —'}</option>)}
          </select>
        </Label>
        <Label label="Phone">
          <input className={inputCls} value={form.phone ?? ''} placeholder="09xx xxx xxx" onChange={(e) => set('phone')(e.target.value)} />
        </Label>
        <Label label="Email">
          <input type="email" className={inputCls} value={form.email ?? ''} placeholder="patient@email.com" onChange={(e) => set('email')(e.target.value)} />
        </Label>
        <Label label="Blood type">
          <select className={inputCls} value={form.blood_type ?? ''} onChange={(e) => set('blood_type')(e.target.value)}>
            {BLOOD_OPTIONS.map((b) => <option key={b || 'none'} value={b} className="[background:var(--surface-input-bg)] text-smile-title">{b || '— select —'}</option>)}
          </select>
        </Label>
        <Label label="Address" colSpan>
          <input className={inputCls} value={form.address ?? ''} placeholder="Street, ward, district, city" onChange={(e) => set('address')(e.target.value)} />
        </Label>
        <Label label="Allergies" colSpan>
          <textarea className={`${inputCls} h-20 resize-none py-2.5`} value={form.allergies ?? ''} placeholder="Penicillin, latex…" onChange={(e) => set('allergies')(e.target.value)} />
        </Label>
        <Label label="Chronic diseases" colSpan>
          <textarea className={`${inputCls} h-20 resize-none py-2.5`} value={form.chronic_diseases ?? ''} placeholder="Diabetes, hypertension…" onChange={(e) => set('chronic_diseases')(e.target.value)} />
        </Label>
      </div>
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-full border [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)] px-5 py-3 text-sm font-semibold text-smile-title transition hover:border-white/25">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition hover:bg-smile-primary-dark disabled:opacity-60 bg-smile-primary"
        >
          {submitting && <Icon icon="line-md:loading-twotone-loop" width={16} />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default PatientFormDark;
