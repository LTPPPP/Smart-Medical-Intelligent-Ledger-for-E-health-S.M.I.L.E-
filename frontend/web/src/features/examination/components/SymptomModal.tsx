'use client';

import { useState } from 'react';

import { Field, ModalShell, inputCls, areaCls } from './modalKit';

export interface SymptomFormValues {
  symptom_name: string;
  body_location?: string;
  severity?: string;
  onset_date?: string;
  duration?: string;
  description?: string;
}

const SEVERITY_OPTIONS = ['', 'mild', 'moderate', 'severe'];

export function SymptomModal({
  initial,
  submitting,
  title,
  onSubmit,
  onClose,
}: {
  initial?: Partial<SymptomFormValues>;
  submitting?: boolean;
  title: string;
  onSubmit: (v: SymptomFormValues) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<SymptomFormValues>({
    symptom_name: '',
    body_location: '',
    severity: '',
    onset_date: '',
    duration: '',
    description: '',
    ...initial,
  });
  const [error, setError] = useState('');
  const set = (k: keyof SymptomFormValues, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.symptom_name.trim()) {
      setError('Symptom name is required.');
      return;
    }
    setError('');
    onSubmit(form);
  };

  return (
    <ModalShell title={title} error={error} submitting={submitting} onClose={onClose} onSubmit={submit}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Symptom name">
          <input className={inputCls} value={form.symptom_name} placeholder="Toothache" onChange={(e) => set('symptom_name', e.target.value)} />
        </Field>
        <Field label="Body location">
          <input className={inputCls} value={form.body_location ?? ''} placeholder="Lower left molar" onChange={(e) => set('body_location', e.target.value)} />
        </Field>
        <Field label="Severity">
          <select className={inputCls} value={form.severity ?? ''} onChange={(e) => set('severity', e.target.value)}>
            {SEVERITY_OPTIONS.map((s) => (
              <option key={s || 'none'} value={s} className="[background:var(--surface-input-bg)] text-smile-title">{s || '—'}</option>
            ))}
          </select>
        </Field>
        <Field label="Onset date">
          <input type="date" className={inputCls} value={form.onset_date ?? ''} onChange={(e) => set('onset_date', e.target.value)} />
        </Field>
        <Field label="Duration">
          <input className={inputCls} value={form.duration ?? ''} placeholder="3 days" onChange={(e) => set('duration', e.target.value)} />
        </Field>
      </div>
      <Field label="Description">
        <textarea className={areaCls} value={form.description ?? ''} placeholder="Additional details…" onChange={(e) => set('description', e.target.value)} />
      </Field>
    </ModalShell>
  );
}

export default SymptomModal;
