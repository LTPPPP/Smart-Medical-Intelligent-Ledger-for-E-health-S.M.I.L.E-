'use client';

import { useState } from 'react';

import { Icon } from '@iconify/react';

const BLUE = '#92CDFD';

export interface RecordOption { record_id: string; label: string }

export interface TreatmentFormValues {
  record_id: string;
  treatment_date: string;
  procedure_name: string;
  tooth_numbers?: number[];
  procedure_code?: string;
  cost?: number;
  status?: string;
  performed_by: string;
}

const STATUS_OPTIONS = ['planned', 'in_progress', 'completed', 'cancelled'];

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

export function TreatmentModal({
  initial, records, defaultDoctorId, defaultDoctorLabel, submitting, title, isEdit, onSubmit, onClose,
}: {
  initial?: Partial<TreatmentFormValues>;
  records: RecordOption[];
  defaultDoctorId?: string;
  defaultDoctorLabel?: string;
  submitting?: boolean;
  title: string;
  isEdit?: boolean;
  onSubmit: (v: TreatmentFormValues) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<{
    record_id: string; treatment_date: string; procedure_name: string;
    tooth_numbers: string; procedure_code: string; cost: string; status: string; performed_by: string;
  }>({
    record_id: records[0]?.record_id ?? '',
    treatment_date: today(),
    procedure_name: '',
    tooth_numbers: '',
    procedure_code: '',
    cost: '',
    status: 'completed',
    performed_by: defaultDoctorId ?? '',
    ...{
      ...(initial?.record_id ? { record_id: initial.record_id } : {}),
      ...(initial?.treatment_date ? { treatment_date: initial.treatment_date.slice(0, 10) } : {}),
      ...(initial?.procedure_name != null ? { procedure_name: initial.procedure_name } : {}),
      ...(initial?.tooth_numbers ? { tooth_numbers: initial.tooth_numbers.join(', ') } : {}),
      ...(initial?.procedure_code != null ? { procedure_code: initial.procedure_code } : {}),
      ...(initial?.cost != null ? { cost: String(initial.cost) } : {}),
      ...(initial?.status != null ? { status: initial.status } : {}),
      ...(initial?.performed_by ? { performed_by: initial.performed_by } : {}),
    },
  });
  const [error, setError] = useState('');
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && !form.record_id) {
      setError('A medical record is required (create one first).');
      return;
    }
    if (!form.procedure_name.trim() || !form.treatment_date || !form.performed_by) {
      setError('Procedure name, treatment date and performer are required.');
      return;
    }
    setError('');

    const teeth = form.tooth_numbers
      .split(',')
      .map((t) => Number(t.trim()))
      .filter((n) => !Number.isNaN(n));

    const out: TreatmentFormValues = {
      record_id: form.record_id,
      treatment_date: form.treatment_date,
      procedure_name: form.procedure_name.trim(),
      performed_by: form.performed_by,
    };
    if (teeth.length) out.tooth_numbers = teeth;
    if (form.procedure_code.trim()) out.procedure_code = form.procedure_code.trim();
    if (form.cost.trim() && !Number.isNaN(Number(form.cost))) out.cost = Number(form.cost);
    if (form.status) out.status = form.status;
    onSubmit(out);
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
            <Field label="Medical record" required>
              <select className={inputCls} value={form.record_id} onChange={(e) => set('record_id', e.target.value)}>
                {records.length === 0 && <option value="" className="bg-[var(--color-surface-elevated)]">No records — create one first</option>}
                {records.map((r) => <option key={r.record_id} value={r.record_id} className="bg-[var(--color-surface-elevated)]">{r.label}</option>)}
              </select>
            </Field>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Procedure name" required>
              <input className={inputCls} value={form.procedure_name} placeholder="Root canal" onChange={(e) => set('procedure_name', e.target.value)} />
            </Field>
            <Field label="Treatment date" required>
              <input type="date" className={inputCls} value={form.treatment_date} onChange={(e) => set('treatment_date', e.target.value)} />
            </Field>
            <Field label="Tooth numbers">
              <input className={inputCls} value={form.tooth_numbers} placeholder="11, 12, 21" onChange={(e) => set('tooth_numbers', e.target.value)} />
            </Field>
            <Field label="Procedure code">
              <input className={inputCls} value={form.procedure_code} placeholder="D3310" onChange={(e) => set('procedure_code', e.target.value)} />
            </Field>
            <Field label="Cost">
              <input type="number" className={inputCls} value={form.cost} placeholder="0" onChange={(e) => set('cost', e.target.value)} />
            </Field>
            <Field label="Status">
              <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="bg-[var(--color-surface-elevated)]">{s}</option>)}
              </select>
            </Field>
            <Field label="Performed by" required>
              <input className={inputCls} value={defaultDoctorLabel ?? form.performed_by} readOnly disabled />
            </Field>
          </div>

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

export default TreatmentModal;
