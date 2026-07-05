'use client';

import { useState } from 'react';

import { Icon } from '@iconify/react';

const BLUE = '#92CDFD';

export interface MedicalHistoryFormValues {
  condition_name: string;
  condition_type?: string;
  diagnosed_date?: string;
  treatment?: string;
  notes?: string;
}

const inputCls =
  'h-11 rounded-xl border px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-smile-primary/40';
const inputStyle = { background: 'var(--surface-input-bg)', borderColor: 'var(--surface-input-border)' };

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">
        {label}{required && <span className="text-red-400"> *</span>}
      </span>
      {children}
    </label>
  );
}

export function MedicalHistoryModal({
  initial, submitting, title, onSubmit, onClose,
}: {
  initial?: Partial<MedicalHistoryFormValues>;
  submitting?: boolean;
  title: string;
  onSubmit: (v: MedicalHistoryFormValues) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<MedicalHistoryFormValues>({
    condition_name: '', condition_type: '', diagnosed_date: '', treatment: '', notes: '',
    ...initial,
  });
  const [error, setError] = useState('');
  const set = (k: keyof MedicalHistoryFormValues, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.condition_name.trim()) {
      setError('Condition name is required.');
      return;
    }
    setError('');
    const cleaned: MedicalHistoryFormValues = { ...form };
    (Object.keys(cleaned) as (keyof MedicalHistoryFormValues)[]).forEach((k) => {
      if (k !== 'condition_name' && cleaned[k] === '') delete cleaned[k];
    });
    onSubmit(cleaned);
  };

  return (
    <section
      className="rounded-[20px] border p-6 backdrop-blur-md"
      style={{ background: 'var(--surface-card-bg)', borderColor: 'var(--surface-card-border)', boxShadow: 'var(--surface-card-shadow)' }}
    >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-poppins text-lg font-semibold text-smile-title">{title}</h3>
          <button onClick={onClose} className="text-smile-description transition hover:text-smile-primary"><Icon icon="lucide:x" width={18} /></button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
            <Icon icon="lucide:alert-circle" width={15} /> {error}
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Condition name" required>
            <input className={inputCls} style={inputStyle} value={form.condition_name} placeholder="Hypertension" onChange={(e) => set('condition_name', e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Condition type">
              <input className={inputCls} style={inputStyle} value={form.condition_type ?? ''} placeholder="chronic / acute" onChange={(e) => set('condition_type', e.target.value)} />
            </Field>
            <Field label="Diagnosed date">
              <input type="date" className={inputCls} style={inputStyle} value={form.diagnosed_date ?? ''} onChange={(e) => set('diagnosed_date', e.target.value)} />
            </Field>
          </div>
          <Field label="Treatment">
            <textarea className={`${inputCls} h-20 resize-none py-2.5`} style={inputStyle} value={form.treatment ?? ''} onChange={(e) => set('treatment', e.target.value)} />
          </Field>
          <Field label="Notes">
            <textarea className={`${inputCls} h-20 resize-none py-2.5`} style={inputStyle} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
          </Field>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border px-5 py-2.5 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40"
              style={{ background: 'var(--surface-panel-bg)', borderColor: 'var(--surface-panel-border)' }}
            >Cancel</button>
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

export default MedicalHistoryModal;
