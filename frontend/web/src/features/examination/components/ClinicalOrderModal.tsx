'use client';

import { useState } from 'react';

import { Field, ModalShell, inputCls, areaCls } from './modalKit';

export interface ClinicalOrderFormValues {
  order_type: string;
  test_type: string;
  clinical_indication?: string;
  teeth_numbers?: number[];
  urgency?: string;
  status?: string;
}

// order_type enum (BE): lab_test | clinical_test for this modal.
const ORDER_TYPE_OPTIONS = [
  { value: 'lab_test', label: 'Laboratory Test' },
  { value: 'clinical_test', label: 'Clinical Test' },
];
const URGENCY_OPTIONS = ['routine', 'urgent', 'stat'];
const STATUS_OPTIONS = ['ordered', 'in_progress', 'completed', 'cancelled'];

export function ClinicalOrderModal({
  defaultOrderType = 'lab_test',
  submitting,
  title,
  onSubmit,
  onClose,
}: {
  defaultOrderType?: string;
  submitting?: boolean;
  title: string;
  onSubmit: (v: ClinicalOrderFormValues) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ClinicalOrderFormValues>({
    order_type: defaultOrderType,
    test_type: '',
    clinical_indication: '',
    urgency: 'routine',
    status: 'ordered',
  });
  const [teethRaw, setTeethRaw] = useState('');
  const [error, setError] = useState('');
  const set = (k: keyof ClinicalOrderFormValues, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.order_type || !form.test_type.trim()) {
      setError('Order type and test type are required.');
      return;
    }
    const teeth = teethRaw
      .split(/[,\s]+/)
      .map((t) => Number(t.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);
    setError('');
    onSubmit({ ...form, teeth_numbers: teeth.length ? teeth : undefined });
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
        <Field label="Test type">
          <input className={inputCls} value={form.test_type} placeholder="CBC / Biopsy / Sensitivity" onChange={(e) => set('test_type', e.target.value)} />
        </Field>
        <Field label="Urgency">
          <select className={inputCls} value={form.urgency ?? 'routine'} onChange={(e) => set('urgency', e.target.value)}>
            {URGENCY_OPTIONS.map((u) => (
              <option key={u} value={u} className="bg-[#101922]">{u}</option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select className={inputCls} value={form.status ?? 'ordered'} onChange={(e) => set('status', e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="bg-[#101922]">{s}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Teeth numbers (comma separated)">
        <input className={inputCls} value={teethRaw} placeholder="16, 17, 26" onChange={(e) => setTeethRaw(e.target.value)} />
      </Field>
      <Field label="Clinical indication">
        <textarea className={areaCls} value={form.clinical_indication ?? ''} placeholder="Reason for the test…" onChange={(e) => set('clinical_indication', e.target.value)} />
      </Field>
    </ModalShell>
  );
}

export default ClinicalOrderModal;
