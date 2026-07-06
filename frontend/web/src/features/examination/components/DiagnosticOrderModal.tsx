'use client';

import { useState } from 'react';
import { Field, ModalShell, inputCls, areaCls } from './modalKit';

export interface DiagnosticOrderFormValues {
  order_type: string;
  priority?: string;
  tooth_number?: string;
  area?: string;
  description?: string;
  notes?: string;
}

// order_type enum (BE): x_ray | cbct | lab_test | clinical_test — this modal is for imaging.
const ORDER_TYPE_OPTIONS = [
  { value: 'x_ray', label: 'X-ray' },
  { value: 'cbct', label: 'CBCT' },
];
const PRIORITY_OPTIONS = ['routine', 'urgent', 'stat'];

export function DiagnosticOrderModal({
  submitting,
  title,
  onSubmit,
  onClose,
}: {
  submitting?: boolean;
  title: string;
  onSubmit: (v: DiagnosticOrderFormValues) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<DiagnosticOrderFormValues>({
    order_type: 'x_ray',
    priority: 'routine',
    tooth_number: '',
    area: '',
    description: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const set = (k: keyof DiagnosticOrderFormValues, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.order_type) {
      setError('Order type is required.');
      return;
    }
    setError('');
    onSubmit(form);
  };

  return (
    <ModalShell title={title} error={error} submitting={submitting} submitLabel="Order" onClose={onClose} onSubmit={submit}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Order type">
          <select className={inputCls} value={form.order_type} onChange={(e) => set('order_type', e.target.value)}>
            {ORDER_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#101922]">{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Priority">
          <select className={inputCls} value={form.priority ?? 'routine'} onChange={(e) => set('priority', e.target.value)}>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p} className="bg-[#101922]">{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Tooth number">
          <input className={inputCls} value={form.tooth_number ?? ''} placeholder="16" onChange={(e) => set('tooth_number', e.target.value)} />
        </Field>
        <Field label="Area">
          <input className={inputCls} value={form.area ?? ''} placeholder="lower-right quadrant" onChange={(e) => set('area', e.target.value)} />
        </Field>
      </div>
      <Field label="Description">
        <input className={inputCls} value={form.description ?? ''} placeholder="Periapical X-ray of #16" onChange={(e) => set('description', e.target.value)} />
      </Field>
      <Field label="Notes">
        <textarea className={areaCls} value={form.notes ?? ''} placeholder="Clinical context…" onChange={(e) => set('notes', e.target.value)} />
      </Field>
    </ModalShell>
  );
}

export default DiagnosticOrderModal;
