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
  'h-11 rounded-xl border border-white/10 bg-[rgba(50,53,56,0.5)] px-4 text-sm text-white outline-none transition placeholder:text-[#6B7280] focus:border-[rgba(146,205,253,0.5)]';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[1px] text-[#8B9199]">
        {label}{required && <span className="text-[#45F0CF]"> *</span>}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-[20px] border border-white/[0.12] bg-[#16191c] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Public Sans, sans-serif' }}>{title}</h3>
          <button onClick={onClose} className="text-[#C1C7CF] transition hover:text-white"><Icon icon="lucide:x" width={18} /></button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
            <Icon icon="lucide:alert-circle" width={15} /> {error}
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Condition name" required>
            <input className={inputCls} value={form.condition_name} placeholder="Hypertension" onChange={(e) => set('condition_name', e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Condition type">
              <input className={inputCls} value={form.condition_type ?? ''} placeholder="chronic / acute" onChange={(e) => set('condition_type', e.target.value)} />
            </Field>
            <Field label="Diagnosed date">
              <input type="date" className={inputCls} value={form.diagnosed_date ?? ''} onChange={(e) => set('diagnosed_date', e.target.value)} />
            </Field>
          </div>
          <Field label="Treatment">
            <textarea className={`${inputCls} h-20 resize-none py-2.5`} value={form.treatment ?? ''} onChange={(e) => set('treatment', e.target.value)} />
          </Field>
          <Field label="Notes">
            <textarea className={`${inputCls} h-20 resize-none py-2.5`} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
          </Field>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-[#E1E2E6] transition hover:border-white/25">Cancel</button>
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
      </div>
    </div>
  );
}

export default MedicalHistoryModal;
