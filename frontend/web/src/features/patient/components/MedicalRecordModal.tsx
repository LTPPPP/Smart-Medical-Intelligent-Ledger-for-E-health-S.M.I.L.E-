'use client';

import { useState } from 'react';

import { Icon } from '@iconify/react';

const BLUE = '#92CDFD';

export interface ClinicOption { clinic_id: string; clinic_name: string }

export interface MedicalRecordFormValues {
  clinic_id: string;
  doctor_id: string;
  visit_date: string;
  chief_complaint?: string;
  diagnosis?: string;
  treatment_plan?: string;
  notes?: string;
}

const inputCls =
  'h-11 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-4 text-sm text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-smile-blue)] disabled:cursor-not-allowed disabled:opacity-80';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[1px] text-[var(--color-text-muted)]">
        {label}{required && <span className="text-[var(--color-smile-teal)]"> *</span>}
      </span>
      {children}
    </label>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

export function MedicalRecordModal({
  initial, clinics, defaultDoctorId, defaultDoctorLabel, submitting, title, isEdit, onSubmit, onClose,
}: {
  initial?: Partial<MedicalRecordFormValues>;
  clinics: ClinicOption[];
  defaultDoctorId?: string;
  defaultDoctorLabel?: string;
  submitting?: boolean;
  title: string;
  isEdit?: boolean;
  onSubmit: (v: MedicalRecordFormValues) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<MedicalRecordFormValues>({
    clinic_id: clinics[0]?.clinic_id ?? '',
    doctor_id: defaultDoctorId ?? '',
    visit_date: today(),
    chief_complaint: '',
    diagnosis: '',
    treatment_plan: '',
    notes: '',
    ...initial,
  });
  const [error, setError] = useState('');
  const set = (k: keyof MedicalRecordFormValues, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && (!form.clinic_id || !form.doctor_id || !form.visit_date)) {
      setError('Clinic, doctor and visit date are required.');
      return;
    }
    setError('');
    const cleaned: MedicalRecordFormValues = { ...form };
    (['chief_complaint', 'diagnosis', 'treatment_plan', 'notes'] as const).forEach((k) => {
      if (cleaned[k] === '') delete cleaned[k];
    });
    onSubmit(cleaned);
  };

  return (
    <section className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]" style={{ fontFamily: 'Public Sans, sans-serif' }}>{title}</h3>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"><Icon icon="lucide:x" width={18} /></button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
            <Icon icon="lucide:alert-circle" width={15} /> {error}
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-4">
          {!isEdit && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Clinic" required>
                <select className={inputCls} value={form.clinic_id} onChange={(e) => set('clinic_id', e.target.value)}>
                  {clinics.length === 0 && <option value="" className="bg-[var(--color-surface-elevated)]">No clinics</option>}
                  {clinics.map((c) => <option key={c.clinic_id} value={c.clinic_id} className="bg-[var(--color-surface-elevated)]">{c.clinic_name}</option>)}
                </select>
              </Field>
              <Field label="Doctor" required>
                <input className={inputCls} value={defaultDoctorLabel ?? form.doctor_id} readOnly disabled />
              </Field>
              <Field label="Visit date" required>
                <input type="date" className={inputCls} value={form.visit_date} onChange={(e) => set('visit_date', e.target.value)} />
              </Field>
            </div>
          )}
          <Field label="Chief complaint">
            <input className={inputCls} value={form.chief_complaint ?? ''} placeholder="Toothache, swelling…" onChange={(e) => set('chief_complaint', e.target.value)} />
          </Field>
          <Field label="Diagnosis">
            <textarea className={`${inputCls} h-20 resize-none py-2.5`} value={form.diagnosis ?? ''} onChange={(e) => set('diagnosis', e.target.value)} />
          </Field>
          <Field label="Treatment plan">
            <textarea className={`${inputCls} h-20 resize-none py-2.5`} value={form.treatment_plan ?? ''} onChange={(e) => set('treatment_plan', e.target.value)} />
          </Field>
          <Field label="Notes">
            <textarea className={`${inputCls} h-20 resize-none py-2.5`} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
          </Field>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:border-[var(--color-smile-blue)]">Cancel</button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-[#003450] transition hover:brightness-95 disabled:opacity-60"
              style={{ background: BLUE, boxShadow: '0 0 15px rgba(146,205,253,0.3)' }}
            >
              {submitting && <Icon icon="line-md:loading-twotone-loop" width={16} />} Save
            </button>
          </div>
        </form>
    </section>
  );
}

export default MedicalRecordModal;
