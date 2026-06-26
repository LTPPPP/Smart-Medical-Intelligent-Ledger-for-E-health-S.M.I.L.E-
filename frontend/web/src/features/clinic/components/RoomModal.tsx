'use client';

import { useState } from 'react';

import { Icon } from '@iconify/react';


export interface RoomFormValues {
  room_name: string;
  room_code: string;
  room_type?: string;
  floor_number?: number | null;
  capacity?: number | null;
  status?: string;
}

const STATUS_OPTIONS = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'];
const TYPE_OPTIONS = ['examination', 'surgery', 'consultation', 'xray'];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  'h-11 rounded-xl border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-[rgba(146,205,253,0.5)]';

export function RoomModal({
  initial, submitting, title, onSubmit, onClose,
}: {
  initial?: Partial<RoomFormValues>;
  submitting?: boolean;
  title: string;
  onSubmit: (v: RoomFormValues) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<RoomFormValues>({
    room_name: '', room_code: '', room_type: 'examination', floor_number: 1, capacity: 1, status: 'AVAILABLE',
    ...initial,
  });
  const [error, setError] = useState('');
  const set = (k: keyof RoomFormValues, v: string | number | null) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.room_name.trim() || !form.room_code.trim()) {
      setError('Room name and code are required.');
      return;
    }
    setError('');
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-[20px] border [border-color:var(--surface-card-border)] [background:var(--surface-card-bg)] backdrop-blur-xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-smile-title" style={{ fontFamily: 'Public Sans, sans-serif' }}>{title}</h3>
          <button onClick={onClose} className="text-smile-description transition hover:text-smile-title"><Icon icon="lucide:x" width={18} /></button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
            <Icon icon="lucide:alert-circle" width={15} /> {error}
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Room name">
              <input className={inputCls} value={form.room_name} placeholder="Examination Room 1" onChange={(e) => set('room_name', e.target.value)} />
            </Field>
            <Field label="Room code">
              <input className={inputCls} value={form.room_code} placeholder="PK-01" onChange={(e) => set('room_code', e.target.value)} />
            </Field>
            <Field label="Type">
              <select className={inputCls} value={form.room_type ?? ''} onChange={(e) => set('room_type', e.target.value)}>
                {TYPE_OPTIONS.map((t) => <option key={t} value={t} className="[background:var(--surface-input-bg)] text-smile-title">{t}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className={inputCls} value={form.status ?? 'AVAILABLE'} onChange={(e) => set('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="[background:var(--surface-input-bg)] text-smile-title">{s}</option>)}
              </select>
            </Field>
            <Field label="Floor">
              <input type="number" className={inputCls} value={form.floor_number ?? ''} onChange={(e) => set('floor_number', e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Field label="Capacity">
              <input type="number" className={inputCls} value={form.capacity ?? ''} onChange={(e) => set('capacity', e.target.value ? Number(e.target.value) : null)} />
            </Field>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-full border [background:var(--surface-input-bg)] [border-color:var(--surface-input-border)] px-5 py-2.5 text-sm font-semibold text-smile-title transition hover:border-white/25">Cancel</button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-smile-primary-dark disabled:opacity-60 bg-smile-primary"
            >
              {submitting && <Icon icon="line-md:loading-twotone-loop" width={16} />} Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RoomModal;
