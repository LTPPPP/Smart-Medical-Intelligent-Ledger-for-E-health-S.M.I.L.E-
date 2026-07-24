'use client';

import { useState } from 'react';

import { Icon } from '@iconify/react';

import type { CategoryOption, RecordOption } from './UploadImageModal';

export interface EditImageFormValues {
  description?: string;
  category_id?: string | null;
  view_angle?: string;
  record_id?: string | null;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[1px] text-smile-description">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  'h-11 rounded-xl border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-smile-primary/50';

export function EditImageModal({
  submitting,
  categories,
  records,
  initial,
  onSubmit,
  onClose,
}: {
  submitting?: boolean;
  categories: CategoryOption[];
  records: RecordOption[];
  initial?: { description?: string; category_id?: string; view_angle?: string; record_id?: string };
  onSubmit: (v: EditImageFormValues) => void;
  onClose: () => void;
}) {
  const [description, setDescription] = useState(initial?.description ?? '');
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '');
  const [viewAngle, setViewAngle] = useState(initial?.view_angle ?? '');
  const [recordId, setRecordId] = useState(initial?.record_id ?? '');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      description: description.trim() || undefined,
      category_id: categoryId || null,
      view_angle: viewAngle.trim() || undefined,
      record_id: recordId || null,
    });
  };

  return (
    <section className="rounded-[20px] border p-6 [border-color:var(--surface-card-border)] [background:var(--surface-panel-bg)]">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-poppins text-lg font-semibold text-smile-title">Edit image</h3>
          <button onClick={onClose} className="text-smile-description transition hover:text-smile-primary"><Icon icon="lucide:x" width={18} /></button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="View angle">
            <input className={inputCls} value={viewAngle} placeholder="bitewing / periapical…" onChange={(e) => setViewAngle(e.target.value)} />
          </Field>
          <Field label="Category">
            <select className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="" className="[background:var(--surface-input-bg)] text-smile-title">— None —</option>
              {categories.map((c) => <option key={c.category_id} value={c.category_id} className="[background:var(--surface-input-bg)] text-smile-title">{c.category_name}</option>)}
            </select>
          </Field>
          <Field label="Attach to treatment profile (medical record)">
            <select className={inputCls} value={recordId} onChange={(e) => setRecordId(e.target.value)}>
              <option value="" className="[background:var(--surface-input-bg)] text-smile-title">— Not attached —</option>
              {records.map((r) => <option key={r.record_id} value={r.record_id} className="[background:var(--surface-input-bg)] text-smile-title">{r.label}</option>)}
            </select>
          </Field>
          <Field label="Description">
            <textarea
              className="min-h-[80px] rounded-xl border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-4 py-2.5 text-sm text-smile-title outline-none transition placeholder:text-smile-description focus:border-smile-primary/50"
              value={description}
              placeholder="Notes about this image…"
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="rounded-full border [border-color:var(--surface-input-border)] [background:var(--surface-input-bg)] px-5 py-2.5 text-sm font-semibold text-smile-title transition hover:border-smile-primary/40">Cancel</button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-full bg-smile-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-smile-primary-dark disabled:opacity-60"
            >
              {submitting && <Icon icon="line-md:loading-twotone-loop" width={16} />} Save
            </button>
          </div>
        </form>
    </section>
  );
}

export default EditImageModal;
