'use client';

import { useState } from 'react';
import { Field, ModalShell, inputCls, areaCls } from './modalKit';

export interface TreatmentPlanFormValues {
  plan_name?: string;
  objectives?: string;
  duration_weeks?: number | null;
  status?: string;
}

const STATUS_OPTIONS = ['active', 'draft', 'completed', 'cancelled'];

export function TreatmentPlanModal({
  initial,
  submitting,
  title,
  onSubmit,
  onClose,
}: {
  initial?: Partial<TreatmentPlanFormValues>;
  submitting?: boolean;
  title: string;
  onSubmit: (v: TreatmentPlanFormValues) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<TreatmentPlanFormValues>({
    plan_name: '',
    objectives: '',
    duration_weeks: null,
    status: 'active',
    ...initial,
  });
  const [error, setError] = useState('');
  const set = (k: keyof TreatmentPlanFormValues, v: string | number | null) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plan_name?.trim()) {
      setError('Plan name is required.');
      return;
    }
    setError('');
    onSubmit(form);
  };

  return (
    <ModalShell title={title} error={error} submitting={submitting} onClose={onClose} onSubmit={submit}>
      <Field label="Plan name">
        <input className={inputCls} value={form.plan_name ?? ''} placeholder="Orthodontic treatment plan" onChange={(e) => set('plan_name', e.target.value)} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Duration (weeks)">
          <input
            type="number"
            min={0}
            className={inputCls}
            value={form.duration_weeks ?? ''}
            onChange={(e) => set('duration_weeks', e.target.value ? Number(e.target.value) : null)}
          />
        </Field>
        <Field label="Status">
          <select className={inputCls} value={form.status ?? 'active'} onChange={(e) => set('status', e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="bg-[#16191c]">{s}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Objectives">
        <textarea className={areaCls} value={form.objectives ?? ''} placeholder="Goals of the treatment plan…" onChange={(e) => set('objectives', e.target.value)} />
      </Field>
    </ModalShell>
  );
}

export default TreatmentPlanModal;
