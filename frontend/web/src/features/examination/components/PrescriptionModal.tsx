'use client';

import { useState } from 'react';

import { validatePrescriptionItemForm } from '@/features/examination/utils/prescriptionFlow';

import { Field, ModalShell, inputCls, areaCls } from './modalKit';

export interface PrescriptionFormValues {
  prescription_date?: string;
  status?: string;
  notes?: string;
}

export function PrescriptionModal({
  initial,
  submitting,
  title,
  onSubmit,
  onClose,
}: {
  initial?: Partial<PrescriptionFormValues>;
  submitting?: boolean;
  title: string;
  onSubmit: (v: PrescriptionFormValues) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<PrescriptionFormValues>({
    prescription_date: new Date().toISOString().slice(0, 10),
    status: 'draft',
    notes: '',
    ...initial,
  });
  const [error, setError] = useState('');
  const set = (k: keyof PrescriptionFormValues, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    onSubmit(form);
  };

  return (
    <ModalShell
      title={title}
      error={error}
      submitting={submitting}
      submitLabel="Create"
      onClose={onClose}
      onSubmit={submit}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Prescription date">
          <input type="date" className={inputCls} value={form.prescription_date ?? ''} onChange={(e) => set('prescription_date', e.target.value)} />
        </Field>
      </div>
      <Field label="Notes">
        <textarea className={areaCls} value={form.notes ?? ''} placeholder="Prescription notes…" onChange={(e) => set('notes', e.target.value)} />
      </Field>
    </ModalShell>
  );
}

export interface PrescriptionItemFormValues {
  medication_name: string;
  medication_code?: string;
  dosage: string;
  route?: string;
  frequency: string;
  duration_days?: number | null;
  quantity?: number | null;
  instructions?: string;
}

export function PrescriptionItemModal({
  submitting,
  title,
  onSubmit,
  onClose,
}: {
  submitting?: boolean;
  title: string;
  onSubmit: (v: PrescriptionItemFormValues) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<PrescriptionItemFormValues>({
    medication_name: '',
    medication_code: '',
    dosage: '',
    route: '',
    frequency: '',
    duration_days: null,
    quantity: null,
    instructions: '',
  });
  const [error, setError] = useState('');
  const set = (k: keyof PrescriptionItemFormValues, v: string | number | null) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validatePrescriptionItemForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    onSubmit(form);
  };

  return (
    <ModalShell
      title={title}
      error={error}
      submitting={submitting}
      submitLabel="Add drug"
      onClose={onClose}
      onSubmit={submit}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Medication name">
          <input className={inputCls} value={form.medication_name} placeholder="Amoxicillin" onChange={(e) => set('medication_name', e.target.value)} />
        </Field>
        <Field label="Medication code">
          <input className={inputCls} value={form.medication_code ?? ''} placeholder="AMOX-500" onChange={(e) => set('medication_code', e.target.value)} />
        </Field>
        <Field label="Dosage">
          <input className={inputCls} value={form.dosage} placeholder="500 mg" onChange={(e) => set('dosage', e.target.value)} />
        </Field>
        <Field label="Route">
          <input className={inputCls} value={form.route ?? ''} placeholder="oral" onChange={(e) => set('route', e.target.value)} />
        </Field>
        <Field label="Frequency">
          <input className={inputCls} value={form.frequency} placeholder="3x / day" onChange={(e) => set('frequency', e.target.value)} />
        </Field>
        <Field label="Duration (days)">
          <input type="number" min={1} className={inputCls} value={form.duration_days ?? ''} onChange={(e) => set('duration_days', e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label="Quantity">
          <input type="number" min={1} className={inputCls} value={form.quantity ?? ''} onChange={(e) => set('quantity', e.target.value ? Number(e.target.value) : null)} />
        </Field>
      </div>
      <Field label="Instructions">
        <textarea className={areaCls} value={form.instructions ?? ''} placeholder="Take after meals…" onChange={(e) => set('instructions', e.target.value)} />
      </Field>
    </ModalShell>
  );
}

export default PrescriptionModal;
